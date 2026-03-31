# main entry point for server; routes frontend request to specific services

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from services.meal_log import meal_log_bp
from services.history import history_bp

# create flask app
app = Flask(__name__)
CORS(app)

app.register_blueprint(meal_log_bp)
app.register_blueprint(history_bp)

# path to our database file
DATABASE = "../DataBase/databites.db"


# helper function to connect to database
def get_db_connection():
    conn = sqlite3.connect(DATABASE, timeout=10)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


# simple test route so we know backend is running
@app.route("/")
def home():
    return jsonify({"message": "backend is running"})


# register new user
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "missing required fields"}), 400

    password_hash = generate_password_hash(password)

    # auto-generate username from email
    username = email.split("@")[0]

    conn = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        """, (username, email, password_hash))

        conn.commit()
        return jsonify({"message": "user registered"}), 201

    except sqlite3.IntegrityError as e:
        return jsonify({"error": str(e)}), 409

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()


# login existing user
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # get login info from frontend
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "missing email or password"}), 400

    conn = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # find user by email
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        # check if user exists and password matches
        if user and check_password_hash(user["password_hash"], password):
            return jsonify({
                "message": "login successful",
                "user": {
                    "user_id": user["user_id"],
                    "email": user["email"]
                }
            }), 200

        # if login fails
        return jsonify({"error": "invalid email or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()


# run the server
if __name__ == "__main__":
    app.run(debug=True)