import sqlite3
import os

db_path = 'data/election.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check existing columns in each table
for table in ['timeline_phases', 'user_alert_statuses', 'user_game_progress', 'family_members']:
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
    exists = cursor.fetchone()
    if not exists:
        print(f"Table {table} does NOT exist")
        continue

    cursor.execute(f'PRAGMA table_info({table})')
    cols = [row[1] for row in cursor.fetchall()]
    print(f'{table} columns: {cols}')

# Add missing columns to timeline_phases
cursor.execute('PRAGMA table_info(timeline_phases)')
cols = [row[1] for row in cursor.fetchall()]

migrations = [
    ('target_role', 'ALTER TABLE timeline_phases ADD COLUMN target_role VARCHAR DEFAULT "both"'),
    ('start_date', 'ALTER TABLE timeline_phases ADD COLUMN start_date DATETIME'),
    ('end_date', 'ALTER TABLE timeline_phases ADD COLUMN end_date DATETIME'),
    ('requirements_json', 'ALTER TABLE timeline_phases ADD COLUMN requirements_json VARCHAR DEFAULT "[]"'),
]

for col, sql in migrations:
    if col not in cols:
        cursor.execute(sql)
        print(f'Added column: {col}')

conn.commit()
conn.close()
print('Migration complete.')
