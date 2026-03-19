import sqlite3

DATABASE = "../DataBase/databites.db"

def view_logs():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Lets us see column names
    cursor = conn.cursor()

    # Query all records from the food_logs table
    cursor.execute("SELECT * FROM food_logs")
    rows = cursor.fetchall()

    print(f"--- Found {len(rows)} Meal Logs ---")
    for row in rows:
        # Convert the row to a dictionary so it prints nicely
        print(dict(row))

    conn.close()

if __name__ == "__main__":
    view_logs()