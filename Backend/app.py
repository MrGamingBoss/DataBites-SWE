#main entry point for server; routes frontend request to specific services

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from services.meal_log import meal_log_bp

# create flask app
app = Flask(__name__)
CORS(app)

app.register_blueprint(meal_log_bp)

# path to our database file
DATABASE = "../DataBase/databites.db"


# helper function to connect to database
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
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

    # get values from frontend
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # make sure nothing is missing
    if not username or not email or not password:
        return jsonify({"error": "missing required fields"}), 400

    # hash the password before storing it
    password_hash = generate_password_hash(password)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # insert new user into database
        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        """, (username, email, password_hash))

        conn.commit()
        conn.close()

        return jsonify({"message": "user registered"}), 201

    # happens if email or username already exists (because of UNIQUE constraint)
    except sqlite3.IntegrityError:
        return jsonify({"error": "user already exists"}), 409

    # catch anything else
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# login existing user
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # get login info from frontend
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "missing email or password"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # find user by email
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    # check if user exists and password matches
    if user and check_password_hash(user["password_hash"], password):
        return jsonify({
            "message": "login successful",
            "user": {
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"]
            }
        }), 200

    # if login fails
    return jsonify({"error": "invalid email or password"}), 401


# run the server
if __name__ == "__main__":
    app.run(debug=True)