import sqlite3

db_path = 'data/election.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create user_alert_statuses table
cursor.execute("""
CREATE TABLE IF NOT EXISTS user_alert_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    alert_id INTEGER NOT NULL,
    status VARCHAR DEFAULT 'unread',
    snoozed_until DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
""")
print("Created user_alert_statuses table")

# Check users table for family_group_id
cursor.execute('PRAGMA table_info(users)')
cols = [row[1] for row in cursor.fetchall()]
print(f'users columns: {cols}')

if 'family_group_id' not in cols:
    cursor.execute('ALTER TABLE users ADD COLUMN family_group_id VARCHAR')
    print('Added family_group_id to users')

conn.commit()
conn.close()
print('Done')
