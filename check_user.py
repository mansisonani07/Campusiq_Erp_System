import sqlite3
conn = sqlite3.connect('student_erp.db')
cursor = conn.cursor()

# Check which user corresponds to student profile id=1
print('=== users table ===')
cursor.execute('SELECT id, name, email, role FROM users WHERE role = "student"')
for row in cursor.fetchall():
    print(row)

print('')
print('=== student profile for user id=1 ===')
cursor.execute('SELECT id, user_id, roll_no, branch_id, semester_id FROM student_profiles WHERE id = 1')
for row in cursor.fetchall():
    print(row)

# Check the branch and semester for profile 1
print('')
print('=== branch info for branch_id=5 ===')
cursor.execute('SELECT id, name, code FROM branches WHERE id = 5')
for row in cursor.fetchall():
    print(row)

print('')
print('=== semester info for semester_id=1 ===')
cursor.execute('SELECT id, branch_id, semester_number, academic_year FROM semesters WHERE id = 1')
for row in cursor.fetchall():
    print(row)

conn.close()
