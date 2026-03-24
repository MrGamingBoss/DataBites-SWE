import requests

BASE_URL = "http://127.0.0.1:5000"

# Note: make sure you've loaded seed_data.sql before running this
# and that the Flask server is running (python app.py)
# we're using user_id=1 (Alice) and her logs from the seed data


def test_get_history():
    print("--- Testing GET /history/1 ---")

    response = requests.get(f"{BASE_URL}/history/1")
    print("Status Code:", response.status_code)
    print("Raw Text:", response.text)
    print("Parsed JSON:", response.json())
    print("Type:", type(response.json()))


def test_get_history_bad_user():
    print("--- Testing GET with a user that doesnt exist ---")

    response = requests.get(f"{BASE_URL}/history/9999")

    print("Status Code:", response.status_code)
    # should return 200 with an empty list, not an error
    print("Response:", response.json())


def test_edit_log():
    print("--- Testing PUT /history/1 (edit Alices oatmeal notes) ---")

    edit_data = {
        "user_id": 1,
        "notes": "added blueberries today"
    }

    response = requests.put(f"{BASE_URL}/history/1", json=edit_data)

    print("Status Code:", response.status_code)
    print("Response:", response.json())


def test_edit_log_wrong_user():
    print("--- Testing PUT /history/1 with the wrong user (should fail) ---")

    edit_data = {
        "user_id": 2,
        "notes": "this should not work"
    }

    response = requests.put(f"{BASE_URL}/history/1", json=edit_data)

    print("Status Code:", response.status_code)  # expecting 404
    print("Response:", response.json())


def test_edit_log_no_user_id():
    print("--- Testing PUT /history/1 with no user_id (should fail) ---")

    response = requests.put(f"{BASE_URL}/history/1", json={"notes": "missing user"})

    print("Status Code:", response.status_code)  # expecting 400
    print("Response:", response.json())


def test_delete_log():
    print("--- Testing DELETE /history/2 (soft delete Alices chicken wrap) ---")

    response = requests.delete(f"{BASE_URL}/history/2", json={"user_id": 1})

    print("Status Code:", response.status_code)
    print("Response:", response.json())


def test_deleted_log_hidden():
    print("--- Checking that log 2 no longer shows up in history ---")

    logs = requests.get(f"{BASE_URL}/history/1").json()
    log_ids = [log["log_id"] for log in logs]

    if 2 not in log_ids:
        print("PASS - deleted log is not showing in history")
    else:
        print("FAIL - deleted log is still showing")


def test_undo_delete():
    print("--- Testing POST /history/2/undo (restore the deleted log) ---")

    response = requests.post(f"{BASE_URL}/history/2/undo", json={"user_id": 1})

    print("Status Code:", response.status_code)
    print("Response:", response.json())


def test_log_restored():
    print("--- Checking that log 2 is back in history after undo ---")

    logs = requests.get(f"{BASE_URL}/history/1").json()
    log_ids = [log["log_id"] for log in logs]

    if 2 in log_ids:
        print("PASS - log was restored")
    else:
        print("FAIL - log is still missing")


def test_undo_edit():
    print("--- Testing POST /history/1/undo (roll back the edit we did earlier) ---")

    response = requests.post(f"{BASE_URL}/history/1/undo", json={"user_id": 1})

    print("Status Code:", response.status_code)
    print("Response:", response.json())


def test_undo_nothing():
    print("--- Testing undo on a log with no audit history (should fail) ---")

    # log_id 3 hasnt been touched so there's nothing to undo
    response = requests.post(f"{BASE_URL}/history/3/undo", json={"user_id": 1})

    print("Status Code:", response.status_code)  # expecting 404
    print("Response:", response.json())


if __name__ == "__main__":
    test_get_history()
    print()
    test_get_history_bad_user()
    print()
    test_edit_log()
    print()
    test_edit_log_wrong_user()
    print()
    test_edit_log_no_user_id()
    print()
    test_delete_log()
    print()
    test_deleted_log_hidden()
    print()
    test_undo_delete()
    print()
    test_log_restored()
    print()
    test_undo_edit()
    print()
    test_undo_nothing()
