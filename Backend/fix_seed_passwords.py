import sqlite3
import os
from werkzeug.security import generate_password_hash

DATABASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../DataBase/databites.db"))

conn = sqlite3.connect(DATABASE)

users = [
    ("alice@test.com", "test1234"),
    ("bob@test.com",   "test1234"),
    ("carol@test.com", "test1234"),
]

for email, password in users:
    real_hash = generate_password_hash(password)
    conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (real_hash, email))

conn.commit()
conn.close()
print("passwords fixed")