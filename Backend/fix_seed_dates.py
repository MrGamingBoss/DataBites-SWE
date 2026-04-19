import sqlite3, os
from datetime import datetime, timedelta

DATABASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../DataBase/databites.db"))
conn = sqlite3.connect(DATABASE)

# shift all food_logs forward by ~6 weeks so they land in current week/month
conn.execute("""
    UPDATE food_logs 
    SET logged_at = datetime(logged_at, '+42 days'),
        created_at = datetime(created_at, '+42 days')
""")

conn.commit()
conn.close()
print("dates updated")