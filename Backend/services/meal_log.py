#Core logic for cerating, reading, updating, and deleting food log entries
from unittest.loader import VALID_MODULE_NAME

from flask import Blueprint, request, jsonify
import sqlite3
import os
from datetime import datetime

# Create a Blueprint for meal logging
meal_log_bp = Blueprint('meal_log', __name__)

# Path to the database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.abspath(os.path.join(BASE_DIR, "../../DataBase/databites.db"))

VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack", "other"}
VALID_MOODS = {"happy", "satisfied", "hungry", "craving", "indulgent", "energized", "sluggish", "nostalgic", "comforted", "adventurous", "bored", "stressed", "tired", "sad"}

def get_db_connection():
    conn = sqlite3.connect(DATABASE, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@meal_log_bp.route("/log_food", methods=["POST"])
def log_food():
    data = request.get_json()

    if not data:
        return jsonify({"error": "invalid or missing JSON body"}), 400

    user_id = data.get("user_id")
    food_name = data.get("food_name", "").strip()
    logged_at = data.get("logged_at")
    meal_type = data.get("meal_type")
    mood = data.get("mood")
    notes = data.get("notes")

    if isinstance(meal_type, str):
        meal_type = meal_type.strip().lower()

    if isinstance(mood, str):
        mood = mood.strip()

    if isinstance(notes, str):
        notes = notes.strip()

    if not user_id or not food_name:
        return jsonify({"error": "missing required fields: user_id or food_name"}), 400

    if not logged_at:
        logged_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if meal_type and meal_type not in VALID_MEAL_TYPES:
        return jsonify({"error": "invalid meal_type"}), 400
    if mood and mood not in VALID_MOODS:      
        return jsonify({"error": "invalid mood"}), 400

    conn = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO food_logs (user_id, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, food_name, logged_at, meal_type, mood, notes))

        log_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO food_log_audit (log_id, user_id, action, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, 'create', ?, ?, ?, ?, ?)
        """, (log_id, user_id, food_name, logged_at, meal_type, mood, notes))

        conn.commit()

        return jsonify({
            "message": "food logged successfully",
            "log": {
                "log_id": log_id,
                "user_id": user_id,
                "food_name": food_name,
                "logged_at": logged_at,
                "meal_type": meal_type,
                "mood": mood,
                "notes": notes
            }
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "invalid user_id or invalid field values"}), 400

    except Exception:
        return jsonify({"error": "internal server error"}), 500

    finally:
        if conn:
            conn.close()
    
# fetch a user's log history with all context fields
@meal_log_bp.route("/food_logs/<int:user_id>", methods=["GET"])
def get_food_logs(user_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT log_id, food_name, logged_at, meal_type, mood, notes, created_at, updated_at
            FROM active_food_logs
            WHERE user_id = ?
            ORDER BY logged_at DESC
        """, (user_id,))

        rows = cursor.fetchall()
        logs = [dict(row) for row in rows]

        return jsonify({
            "user_id": user_id,
            "count": len(logs),
            "logs": logs
        }), 200

    except Exception:
        return jsonify({"error": "internal server error"}), 500
    finally:
        if conn:
            conn.close()


# edit context fields on an existing log entry
@meal_log_bp.route("/food_logs/<int:log_id>", methods=["PATCH"])
def update_food_log(log_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "invalid or missing JSON body"}), 400

    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "missing required field: user_id"}), 400

    EDITABLE_FIELDS = {"food_name", "logged_at", "meal_type", "mood", "notes"}
    updates = {}

    for field in EDITABLE_FIELDS:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip().lower() if field in {"meal_type", "mood"} else value.strip() or None
            updates[field] = value

    if not updates:
        return jsonify({"error": "no valid fields provided to update"}), 400
    if "meal_type" in updates and updates["meal_type"] and updates["meal_type"] not in VALID_MEAL_TYPES:
        return jsonify({"error": "invalid meal_type"}), 400
    if "mood" in updates and updates["mood"] and updates["mood"] not in VALID_MOODS:
        return jsonify({"error": "invalid mood"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # confirm log exists, belongs to this user, and is not deleted
        cursor.execute("""
            SELECT * FROM food_logs
            WHERE log_id = ? AND user_id = ? AND deleted_at IS NULL
        """, (log_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "log entry not found or already deleted"}), 404

        set_clause = ", ".join(f"{field} = ?" for field in updates)
        values = list(updates.values()) + [log_id]

        cursor.execute(f"UPDATE food_logs SET {set_clause} WHERE log_id = ?", values)

        # re-fetch updated row to snapshot into audit
        cursor.execute("SELECT * FROM food_logs WHERE log_id = ?", (log_id,))
        updated = cursor.fetchone()

        cursor.execute("""
            INSERT INTO food_log_audit (log_id, user_id, action, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, 'edit', ?, ?, ?, ?, ?)
        """, (log_id, user_id, updated["food_name"], updated["logged_at"],
              updated["meal_type"], updated["mood"], updated["notes"]))

        conn.commit()
        return jsonify({
            "message": "log entry updated successfully",
            "log": {
                "log_id": log_id,
                "food_name": updated["food_name"],
                "logged_at": updated["logged_at"],
                "meal_type": updated["meal_type"],
                "mood": updated["mood"],
                "notes": updated["notes"],
                "updated_at": updated["updated_at"]
            }
        }), 200

    except sqlite3.IntegrityError:
        return jsonify({"error": "invalid field values"}), 400
    except Exception:
        return jsonify({"error": "internal server error"}), 500
    finally:
        if conn:
            conn.close()


# returns valid dropdown values for mood and meal type
@meal_log_bp.route("/food_logs/options", methods=["GET"])
def get_log_options():
    return jsonify({
        "meal_types": sorted(VALID_MEAL_TYPES),
        "moods": sorted(VALID_MOODS)
    }), 200