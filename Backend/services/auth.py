#handles user registration, login, and session verification

from flask import Blueprint, request, jsonify
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.abspath(os.path.join(BASE_DIR, "../../DataBase/databites.db"))


def get_db_connection():
    conn = sqlite3.connect(DATABASE, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"error": "invalid or missing JSON body"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "missing required fields"}), 400

    password_hash = generate_password_hash(password)
    username = email.split("@")[0]

    conn = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
                       INSERT INTO users (email, password_hash)
                       VALUES (?, ?)
                       """, (email, password_hash))

        conn.commit()
        return jsonify({"message": "user registered"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "email already registered"}), 409

    except Exception:
        return jsonify({"error": "internal server error"}), 500

    finally:
        if conn:
            conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "invalid or missing JSON body"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "missing email or password"}), 400

    conn = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if user and check_password_hash(user["password_hash"], password):
            return jsonify({
                "message": "login successful",
                "user": {
                    "user_id": user["user_id"],
                    "email": user["email"]
                }
            }), 200

        return jsonify({"error": "invalid email or password"}), 401

    except Exception:
        return jsonify({"error": "internal server error"}), 500

    finally:
        if conn:
            conn.close()
