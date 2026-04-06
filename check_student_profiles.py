from app.database import SessionLocal
from app.models import StudentProfile, User

db = SessionLocal()

# Get all student users
student_users = db.query(User).filter(User.role == 'student').all()
print(f'Student users: {len(student_users)}')
for u in student_users:
    print(f'  {u.email} (id={u.id})')

# Get all student profiles
profiles = db.query(StudentProfile).all()
print(f'\nStudent profiles: {len(profiles)}')
for p in profiles:
    user = db.query(User).filter(User.id == p.user_id).first()
    print(f'  user_id={p.user_id}, roll_no={p.roll_no}, department={p.department}, branch_id={p.branch_id}, semester_id={p.semester_id}')

# Check if there's a profile for rahul
print('\n--- Looking for rahul@erp.local ---')
rahul = db.query(User).filter(User.email == 'rahul@erp.local').first()
if rahul:
    print(f'rahul user_id: {rahul.id}, role: {rahul.role}')
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == rahul.id).first()
    print(f'Profile for rahul: {profile}')

# Find which profile belongs to which user
print('\n--- All users with profiles ---')
for p in profiles:
    u = db.query(User).filter(User.id == p.user_id).first()
    if u:
        print(f'Profile {p.roll_no} -> User {u.email}')

db.close()
