#Core logic for cerating, reading, updating, and deleting food log entries
from flask import Blueprint, request, jsonify
import sqlite3

# Create a Blueprint for meal logging
meal_log_bp = Blueprint('meal_log', __name__)

# Path to the database (relative to where app.py runs)
DATABASE = "../DataBase/databites.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@meal_log_bp.route("/log_food", methods=["POST"])
def log_food():
    data = request.get_json()

    # Get fields based on PBI #2 and #3 from the schema
    user_id = data.get("user_id")
    food_name = data.get("food_name")
    logged_at = data.get("logged_at")
    meal_type = data.get("meal_type")
    mood = data.get("mood")
    notes = data.get("notes")

    # ensures that user_id, food_name, and logged_at are NOT NULL in the database
    if not user_id or not food_name or not logged_at:
        return jsonify({"error": "missing required fields: user_id, food_name, or logged_at"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert new food log into the database
        cursor.execute("""
            INSERT INTO food_logs (user_id, food_name, logged_at, meal_type, mood, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, food_name, logged_at, meal_type, mood, notes))

        conn.commit()
        conn.close()

        return jsonify({"message": "food logged successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500