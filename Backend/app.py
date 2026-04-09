# main entry point for server; routes frontend request to specific services

from flask import Flask, jsonify
from flask_cors import CORS

from services.meal_log import meal_log_bp
from services.history import history_bp
from services.auth import auth_bp
from services.insights import insights_bp

# create flask app
app = Flask(__name__)
CORS(app)

# register all service routes
app.register_blueprint(meal_log_bp)
app.register_blueprint(history_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(insights_bp)

# simple test route so we know backend is running
@app.route("/")
def home():
    return jsonify({"message": "backend is running"})

# run the server
if __name__ == "__main__":
    app.run(debug=True)
