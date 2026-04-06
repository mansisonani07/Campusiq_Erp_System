import requests

BASE = "http://127.0.0.1:8000"
session = requests.Session()

# Test 1 - Admin login
r = session.post(f"{BASE}/login-simple", data={
    "email": "admin@erp.local", 
    "password": "admin123"
}, allow_redirects=True)
print("ADMIN LOGIN:", "PASS" if "/admin/dashboard" in r.url else f"FAIL - went to {r.url}")

# Test admin pages
pages = [
    ("/admin/dashboard", "Admin Dashboard"),
    ("/admin/students", "Students"),
    ("/admin/branches", "Branches"),
    ("/admin/subjects", "Subjects"),
    ("/admin/circulars", "Circulars"),
    ("/admin/timetables", "Timetables"),
    ("/admin/exam-schedules", "Exam Schedules"),
    ("/admin/results", "Results"),
    ("/admin/fees", "Fees"),
    ("/admin/transport", "Transport"),
    ("/admin/hostel", "Hostel"),
    ("/admin/fee-structure", "Fee Structure"),
    ("/admin/promote-students", "Promote Students"),
    ("/admin/academic-years", "Academic Years"),
    ("/admin/audit-log", "Audit Log"),
    ("/admin/study-materials", "Study Materials"),
    ("/admin/attendance/report", "Attendance Report"),
]

for path, name in pages:
    r = session.get(f"{BASE}{path}")
    status = "PASS" if r.status_code == 200 else f"FAIL ({r.status_code})"
    print(f"ADMIN {name}: {status}")

# Test 2 - Teacher login
session2 = requests.Session()
r = session2.post(f"{BASE}/login-simple", data={
    "email": "teacher@erp.local",
    "password": "teacher123"
}, allow_redirects=True)
print("\nTEACHER LOGIN:", "PASS" if "/teacher/dashboard" in r.url else f"FAIL - went to {r.url}")

teacher_pages = [
    ("/teacher/dashboard", "Teacher Dashboard"),
    ("/teacher/students", "My Students"),
    ("/teacher/attendance", "Attendance"),
    ("/teacher/grades", "Marks Entry"),
    ("/teacher/notices", "Notices"),
    ("/teacher/circulars", "Circulars"),
    ("/teacher/exam-schedule", "Exam Schedule"),
    ("/teacher/profile", "Profile"),
    ("/teacher/study-materials", "Study Materials"),
    ("/teacher/leave-applications", "Leave Applications"),
]

for path, name in teacher_pages:
    r = session2.get(f"{BASE}{path}")
    status = "PASS" if r.status_code == 200 else f"FAIL ({r.status_code})"
    print(f"TEACHER {name}: {status}")

# Teacher cannot access admin
r = session2.get(f"{BASE}/admin/dashboard", allow_redirects=True)
blocked = "/admin/dashboard" not in r.url or r.status_code == 403
print(f"TEACHER blocked from admin: {'PASS' if blocked else 'FAIL'}")

# Test 3 - Student login
session3 = requests.Session()
r = session3.post(f"{BASE}/login-simple", data={
    "email": "student@erp.local",
    "password": "student123"
}, allow_redirects=True)
print("\nSTUDENT LOGIN:", "PASS" if "/student/dashboard" in r.url else f"FAIL - went to {r.url}")

student_pages = [
    ("/student/dashboard", "Student Dashboard"),
    ("/student/attendance", "My Attendance"),
    ("/student/fees", "My Fees"),
    ("/student/results", "My Results"),
    ("/student/timetable", "Timetable"),
    ("/student/exam-schedule", "Exam Schedule"),
    ("/student/notices", "Notices"),
    ("/student/circulars", "Circulars"),
    ("/student/transport", "Transport"),
    ("/student/hostel", "Hostel"),
    ("/student/study-materials", "Study Materials"),
    ("/student/leave", "Leave Application"),
    ("/student/profile", "My Profile"),
]

for path, name in student_pages:
    r = session3.get(f"{BASE}{path}")
    status = "PASS" if r.status_code == 200 else f"FAIL ({r.status_code})"
    print(f"STUDENT {name}: {status}")

# Student cannot access admin
r = session3.get(f"{BASE}/admin/dashboard", allow_redirects=True)
blocked = "/admin/dashboard" not in r.url or r.status_code == 403
print(f"STUDENT blocked from admin: {'PASS' if blocked else 'FAIL'}")

# Student cannot access teacher
r = session3.get(f"{BASE}/teacher/dashboard", allow_redirects=True)
blocked = "/teacher/dashboard" not in r.url or r.status_code == 403
print(f"STUDENT blocked from teacher: {'PASS' if blocked else 'FAIL'}")

print("\nTEST COMPLETE")
