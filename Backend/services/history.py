#History Features - handles getting, editing, deleting, and undoing food logs
from flask import Blueprint, request, jsonify
import sqlite3
import os

# blueprint for history routes
history_bp = Blueprint('history', __name__)

# same db path as the other files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.abspath(os.path.join(BASE_DIR, "../../DataBase/databites.db"))

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# returns all food logs for a user that havent been deleted
# also grabs the last changed time from the audit table so we can show it on each entry
@history_bp.route("/history/<int:user_id>", methods=["GET"])
def get_history(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # using the views we made in the schema to keep this cleaner
        cursor.execute("""
            SELECT
                f.log_id,
                f.food_name,
                f.logged_at,
                f.meal_type,
                f.mood,
                f.notes,
                f.created_at,
                f.updated_at,
                a.last_action,
                a.last_changed_at
            FROM active_food_logs f
            LEFT JOIN latest_audit_per_log a ON f.log_id = a.log_id
            WHERE f.user_id = ?
            ORDER BY f.logged_at DESC
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()

        return jsonify([dict(row) for row in rows]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# lets a user edit one of their food logs
@history_bp.route("/history/<int:log_id>", methods=["PUT"])
def edit_log(log_id):
    data = request.get_json()

    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # check that the log exists, belongs to this user, and isnt deleted
        cursor.execute("""
            SELECT * FROM food_logs
            WHERE log_id = ? AND user_id = ? AND deleted_at IS NULL
        """, (log_id, user_id))
        existing = cursor.fetchone()

        if not existing:
            conn.close()
            return jsonify({"error": "log not found"}), 404

        # if a field wasnt sent just keep the old value
        VALID_MOODS = {"happy", "satisfied", "hungry", "craving", "indulgent", "energized",
                       "sluggish", "nostalgic", "comforted", "adventurous", "bored", "stressed",
                       "tired", "sad"}

        food_name = data.get("food_name", existing["food_name"])
        logged_at = data.get("logged_at",  existing["logged_at"])
        meal_type = data.get("meal_type",  existing["meal_type"])
        mood      = data.get("mood",       existing["mood"])
        notes     = data.get("notes",      existing["notes"])

        if mood and mood not in VALID_MOODS:
            conn.close()
            return jsonify({"error": f"invalid mood: {mood}"}), 400

        cursor.execute("""
            UPDATE food_logs
            SET food_name = ?, logged_at = ?, meal_type = ?, mood = ?, notes = ?
            WHERE log_id = ?
        """, (food_name, logged_at, meal_type, mood, notes, log_id))

        # save to audit table so undo works
        cursor.execute("""
            INSERT INTO food_log_audit (log_id, user_id, action, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, 'edit', ?, ?, ?, ?, ?)
        """, (log_id, user_id, food_name, logged_at, meal_type, mood, notes))

        conn.commit()
        conn.close()

        return jsonify({"message": "log updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# deletes a food log but doesnt actually remove it from the database
# we just set deleted_at so we can restore it later with undo
@history_bp.route("/history/<int:log_id>", methods=["DELETE"])
def delete_log(log_id):
    data = request.get_json()
    user_id = data.get("user_id") if data else None

    if not user_id:
        return jsonify({"error": "missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # make sure the log exists and belongs to this user
        cursor.execute("""
            SELECT * FROM food_logs
            WHERE log_id = ? AND user_id = ? AND deleted_at IS NULL
        """, (log_id, user_id))
        existing = cursor.fetchone()

        if not existing:
            conn.close()
            return jsonify({"error": "log not found"}), 404

        # soft delete - keeps the row in the database so undo can bring it back
        cursor.execute("""
            UPDATE food_logs SET deleted_at = CURRENT_TIMESTAMP WHERE log_id = ?
        """, (log_id,))

        # save to audit table with the old values in case we need to restore
        cursor.execute("""
            INSERT INTO food_log_audit (log_id, user_id, action, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, 'delete', ?, ?, ?, ?, ?)
        """, (log_id, user_id, existing["food_name"], existing["logged_at"],
              existing["meal_type"], existing["mood"], existing["notes"]))

        conn.commit()
        conn.close()

        return jsonify({"message": "log deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# undoes the last thing the user did to a log entry
# if they deleted it we restore it, if they edited it we roll back to the previous version
@history_bp.route("/history/<int:log_id>/undo", methods=["POST"])
def undo_log(log_id):
    data = request.get_json()
    user_id = data.get("user_id") if data else None

    if not user_id:
        return jsonify({"error": "missing user_id"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # grab the last 2 audit records so we know what to undo
        cursor.execute("""
            SELECT * FROM food_log_audit
            WHERE log_id = ? AND user_id = ?
            ORDER BY audit_id DESC
            LIMIT 2
        """, (log_id, user_id))
        audit_rows = cursor.fetchall()

        if not audit_rows:
            conn.close()
            return jsonify({"error": "nothing to undo"}), 404

        last = audit_rows[0]

        if last["action"] == "delete":
            # bring the deleted entry back
            cursor.execute("UPDATE food_logs SET deleted_at = NULL WHERE log_id = ?", (log_id,))

        elif last["action"] == "edit" and len(audit_rows) > 1:
            # put the values back to what they were before the edit
            prev = audit_rows[1]
            cursor.execute("""
                UPDATE food_logs
                SET food_name = ?, logged_at = ?, meal_type = ?, mood = ?, notes = ?
                WHERE log_id = ?
            """, (prev["food_name"], prev["logged_at"], prev["meal_type"],
                  prev["mood"], prev["notes"], log_id))

        else:
            conn.close()
            return jsonify({"error": "nothing to undo"}), 400

        # log the restore in the audit table
        cursor.execute("""
            INSERT INTO food_log_audit (log_id, user_id, action, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, 'restore', ?, ?, ?, ?, ?)
        """, (log_id, user_id, last["food_name"], last["logged_at"],
              last["meal_type"], last["mood"], last["notes"]))

        conn.commit()
        conn.close()

        return jsonify({"message": "undo successful"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
