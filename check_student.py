from app.database import SessionLocal
from app.models import StudentProfile, User, Branch, Semester

db = SessionLocal()

student_user = db.query(User).filter(User.role == 'student').first()
if student_user:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
    print('Student:', student_user.email)
    if profile:
        branch = db.query(Branch).filter(Branch.id == profile.branch_id).first() if profile.branch_id else None
        semester = db.query(Semester).filter(Semester.id == profile.semester_id).first() if profile.semester_id else None
        print('Branch:', branch.name if branch else 'None')
        print('Semester:', semester.semester_number if semester else 'None')
    else:
        print('No profile')
else:
    print('No student user found')

# Check teacher profile too
teacher_user = db.query(User).filter(User.role == 'teacher').first()
if teacher_user:
    from app.models import TeacherProfile
    tprofile = db.query(TeacherProfile).filter(TeacherProfile.user_id == teacher_user.id).first()
    print('\nTeacher:', teacher_user.email)
    if tprofile:
        branch = db.query(Branch).filter(Branch.id == tprofile.branch_id).first() if tprofile.branch_id else None
        semester = db.query(Semester).filter(Semester.id == tprofile.semester_id).first() if tprofile.semester_id else None
        print('Branch:', branch.name if branch else 'None')
        print('Semester:', semester.semester_number if semester else 'None')
    else:
        print('No teacher profile')

db.close()
