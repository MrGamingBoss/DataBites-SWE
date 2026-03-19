import requests
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000"


def test_logging():
    print("--- Testing Food Logging ---")

    # We simulate the data the React frontend would send
    # Note: This assumes a user with user_id=1 already exists in your DB!
    log_data = {
        "user_id": 1,
        "food_name": "Grilled Chicken Sandwich",
        "logged_at": datetime.now().isoformat(),
        "meal_type": "lunch",
        "mood": "happy",
        "notes": "Ate at the dining hall"
    }

    # Send the POST request to the new endpoint
    response = requests.post(f"{BASE_URL}/log_food", json=log_data)

    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())


if __name__ == "__main__":
    test_logging()