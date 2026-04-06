"""
Seed initial data for the new ERP system
Creates branches, semesters, subjects, and default users
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, datetime
from app.database import SessionLocal
from app.models_new import Branch, Semester, Subject, User, Student, Teacher
from app.auth import hash_password

def seed():
    db = SessionLocal()
    
    try:
        print("Seeding initial data...")
        
        # Create branches
        branches_data = [
            {"name": "Bachelor of Computer Applications", "code": "BCA"},
            {"name": "Bachelor of Business Administration", "code": "BBA"},
            {"name": "Master of Computer Applications", "code": "MCA"},
            {"name": "Master of Business Administration", "code": "MBA"},
        ]
        
        branches = {}
        for b in branches_data:
            existing = db.query(Branch).filter(Branch.code == b["code"]).first()
            if not existing:
                branch = Branch(name=b["name"], code=b["code"])
                db.add(branch)
                db.flush()
                branches[b["code"]] = branch
                print(f"  Created branch: {b['code']}")
            else:
                branches[b["code"]] = existing
                print(f"  Branch already exists: {b['code']}")
        
        # Create semesters for each branch
        semesters_data = []
        for branch_code, branch in branches.items():
            for sem_num in range(1, 7):  # Sem 1 to Sem 6
                year = 2025 if sem_num <= 2 else 2024
                academic_year = f"{year}-{year+1}"
                
                existing = db.query(Semester).filter(
                    Semester.branch_id == branch.id,
                    Semester.semester_number == sem_num
                ).first()
                
                if not existing:
                    semester = Semester(
                        branch_id=branch.id,
                        semester_number=sem_num,
                        academic_year=academic_year,
                        is_active=1
                    )
                    db.add(semester)
                    db.flush()
                    print(f"  Created {branch_code} Sem {sem_num}")
                else:
                    print(f"  Semester already exists: {branch_code} Sem {sem_num}")
        
        db.commit()
        
        # Get BCA Sem 3 for student and teacher
        bca = branches["BCA"]
        bca_sem3 = db.query(Semester).filter(
            Semester.branch_id == bca.id,
            Semester.semester_number == 3
        ).first()
        
        # Create subjects for BCA Sem 3
        subjects_data = [
            {"name": "Data Structures", "code": "BCA-301", "type": "theory", "credits": 4},
            {"name": "Database Management Systems", "code": "BCA-302", "type": "theory", "credits": 4},
            {"name": "Operating Systems", "code": "BCA-303", "type": "theory", "credits": 3},
            {"name": "Mathematics III", "code": "BCA-304", "type": "theory", "credits": 3},
            {"name": "Computer Networks", "code": "BCA-305", "type": "theory", "credits": 3},
            {"name": "Data Structures Lab", "code": "BCA-306", "type": "practical", "credits": 2},
            {"name": "DBMS Lab", "code": "BCA-307", "type": "practical", "credits": 2},
        ]
        
        subjects = []
        for s in subjects_data:
            existing = db.query(Subject).filter(Subject.subject_code == s["code"]).first()
            if not existing:
                subject = Subject(
                    semester_id=bca_sem3.id,
                    subject_name=s["name"],
                    subject_code=s["code"],
                    subject_type=s["type"],
                    credits=s["credits"]
                )
                db.add(subject)
                db.flush()
                subjects.append(subject)
                print(f"  Created subject: {s['code']}")
            else:
                subjects.append(existing)
                print(f"  Subject already exists: {s['code']}")
        
        db.commit()
        
        # Create default users
        users_data = [
            {"name": "Admin User", "email": "admin@erp.local", "role": "admin", "password": "admin123"},
            {"name": "Teacher User", "email": "teacher@erp.local", "role": "teacher", "password": "teacher123"},
            {"name": "Student User", "email": "student@erp.local", "role": "student", "password": "student123"},
        ]
        
        users = {}
        for u in users_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    is_active=1
                )
                db.add(user)
                db.flush()
                users[u["role"]] = user
                print(f"  Created user: {u['email']}")
            else:
                users[u["role"]] = existing
                print(f"  User already exists: {u['email']}")
        
        db.commit()
        
        # Create teacher profile
        teacher_user = users.get("teacher")
        if teacher_user:
            existing_teacher = db.query(Teacher).filter(Teacher.user_id == teacher_user.id).first()
            if not existing_teacher:
                teacher = Teacher(
                    user_id=teacher_user.id,
                    branch_id=bca.id,
                    semester_id=bca_sem3.id,
                    subject_id=subjects[0].id if subjects else None,
                    qualification="M.Tech",
                    phone="9990001111"
                )
                db.add(teacher)
                db.commit()
                print(f"  Created teacher profile")
            else:
                print(f"  Teacher profile already exists")
        
        # Create student profile
        student_user = users.get("student")
        if student_user:
            existing_student = db.query(Student).filter(Student.user_id == student_user.id).first()
            if not existing_student:
                student = Student(
                    user_id=student_user.id,
                    branch_id=bca.id,
                    semester_id=bca_sem3.id,
                    roll_number="BCA-2024-001",
                    phone="9990002222",
                    guardian_name="John Doe",
                    guardian_phone="9990003333"
                )
                db.add(student)
                db.commit()
                print(f"  Created student profile: BCA-2024-001")
            else:
                print(f"  Student profile already exists")
        
        print("\n✓ Seed data created successfully!")
        print("\nDefault login credentials:")
        print("  Admin: admin@erp.local / admin123")
        print("  Teacher: teacher@erp.local / teacher123")
        print("  Student: student@erp.local / student123")
        print("\n  Student assigned to: BCA Sem 3")
        print("  Teacher assigned to: BCA Sem 3 (Data Structures)")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
