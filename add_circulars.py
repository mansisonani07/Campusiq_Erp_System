import sqlite3
conn = sqlite3.connect('student_erp.db')
cursor = conn.cursor()

# Check the circulars table structure
print('=== Circulars table structure ===')
cursor.execute("PRAGMA table_info(circulars)")
for row in cursor.fetchall():
    print(row)

# Add test circulars with posted_by_admin_id
cursor.execute("INSERT INTO circulars (title, message, target_branch, target_semester, posted_by_admin_id) VALUES ('CS Sem 1 Only', 'This is for CS students only', 'CS', 0, 1)")
cursor.execute("INSERT INTO circulars (title, message, target_branch, target_semester, posted_by_admin_id) VALUES ('All Branches', 'This is for everyone', 'ALL', 0, 1)")
cursor.execute("INSERT INTO circulars (title, message, target_branch, target_semester, posted_by_admin_id) VALUES ('BBA Only', 'This is for BBA students', 'BBA', 0, 1)")

conn.commit()

print('')
print('=== Circulars after insert ===')
cursor.execute('SELECT id, title, target_branch, target_semester FROM circulars')
for row in cursor.fetchall():
    print(row)

conn.close()
