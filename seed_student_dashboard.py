"""
Seed Student Dashboard Data
This script adds comprehensive sample data specifically for the test student "Rahul Sharma"
to populate the student dashboard with Attendance, Grades, and Fee records.

Test Student Credentials:
- Email: rahul@erp.local
- Password: student123
- Roll No: STU1001
- Department: Computer Science
- Branch: Computer Science
- Semester: 3
"""

from datetime import date, datetime, timedelta
import random
from app.database import SessionLocal
from app import models
from app.auth import hash_password


def seed_student_dashboard(student_email: str = "rahul@erp.local"):
    """Add detailed dashboard data for a specific student"""
    db = SessionLocal()
    
    try:
        print(f"\n🌱 Seeding dashboard data for student: {student_email}")
        
        # ==================== STEP 1: Get or Create Branch ====================
        branch = db.query(models.Branch).filter(models.Branch.code == "CSE").first()
        if not branch:
            branch = models.Branch(
                name="Computer Science & Engineering",
                code="CSE"
            )
            db.add(branch)
            db.flush()
            print("✓ Created Branch: Computer Science & Engineering")
        else:
            print("✓ Using existing Branch: Computer Science & Engineering")
        
        # ==================== STEP 2: Get or Create Semester 3 ====================
        semester = db.query(models.Semester).filter(
            models.Semester.branch_id == branch.id,
            models.Semester.semester_number == 3
        ).first()
        
        if not semester:
            semester = models.Semester(
                branch_id=branch.id,
                semester_number=3,
                academic_year="2024-25"
            )
            db.add(semester)
            db.flush()
            print("✓ Created Semester 3")
        else:
            print("✓ Using existing Semester 3")
        
        # ==================== STEP 3: Get or Create Test Student ====================
        user = db.query(models.User).filter(models.User.email == student_email).first()
        
        if not user:
            user = models.User(
                name="Rahul Sharma",
                email=student_email,
                password_hash=hash_password("student123"),
                role="student"
            )
            db.add(user)
            db.flush()
            print(f"✓ Created Student User: {student_email}")
        else:
            print(f"✓ Using existing Student User: {student_email}")
        
        # Get or create student profile
        profile = db.query(models.StudentProfile).filter(
            models.StudentProfile.user_id == user.id
        ).first()
        
        if not profile:
            profile = models.StudentProfile(
                user_id=user.id,
                roll_no="STU1001",
                department="Computer Science & Engineering",
                year=2,
                phone="9876543210",
                guardian_name="Ramesh Sharma",
                branch_id=branch.id,
                semester_id=semester.id
            )
            db.add(profile)
            db.flush()
            print(f"✓ Created Student Profile: {user.name}")
        else:
            # Update branch and semester if not set
            if not profile.branch_id:
                profile.branch_id = branch.id
            if not profile.semester_id:
                profile.semester_id = semester.id
            db.flush()
            print(f"✓ Updated Student Profile with Branch and Semester")
        
        # ==================== STEP 4: Create Courses ====================
        course_data = [
            ("CS201", "Programming with Python", 4),
            ("MA201", "Mathematics - Linear Algebra", 3),
            ("CS202", "Data Structures", 4),
            ("SC201", "Physics - Mechanics", 4),
            ("CS203", "Web Development Basics", 3),
            ("MA202", "Statistics & Probability", 3),
        ]
        
        courses = []
        for code, title, credits in course_data:
            course = db.query(models.Course).filter(models.Course.code == code).first()
            if not course:
                course = models.Course(
                    code=code,
                    title=title,
                    credits=credits,
                    semester=f"Sem 3"
                )
                db.add(course)
                courses.append(course)
            else:
                courses.append(course)
        
        db.flush()
        print(f"✓ Created/Found {len(courses)} courses")
        
        # ==================== STEP 5: Create Enrollments ====================
        enrollments = []
        for course in courses:
            enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == profile.id,
                models.Enrollment.course_id == course.id
            ).first()
            
            if not enrollment:
                enrollment = models.Enrollment(
                    student_id=profile.id,
                    course_id=course.id
                )
                db.add(enrollment)
                enrollments.append(enrollment)
        
        db.flush()
        print(f"✓ Created {len(enrollments)} new enrollments for student")
        
        # Get all enrollments for this student (including pre-existing)
        all_enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == profile.id
        ).all()
        
        # ==================== STEP 6: Create Attendance Records ====================
        today = date.today()
        attendance_records = []
        
        for days_ago in range(35):  # Last 35 days
            att_date = today - timedelta(days=days_ago)
            
            # Skip weekends
            if att_date.weekday() >= 5:
                continue
            
            # For each enrollment, create an attendance record
            for enrollment in all_enrollments:
                # Check if attendance already exists for this date
                existing = db.query(models.Attendance).filter(
                    models.Attendance.enrollment_id == enrollment.id,
                    models.Attendance.date == att_date
                ).first()
                
                if not existing:
                    # 75-95% present probability (realistic attendance)
                    present_probability = random.uniform(0.75, 0.95)
                    status = "present" if random.random() < present_probability else "absent"
                    
                    att = models.Attendance(
                        enrollment_id=enrollment.id,
                        date=att_date,
                        status=status
                    )
                    db.add(att)
                    attendance_records.append(att)
        
        db.flush()
        print(f"✓ Created {len(attendance_records)} new attendance records")
        
        # ==================== STEP 7: Create Grade Records ====================
        grade_records = []
        exam_types = ["Mid Term", "End Term", "Unit Test 1"]
        course_names = ["Python", "Mathematics", "Data Structures", "Physics", "Web Development", "Statistics"]
        
        for enrollment in all_enrollments:
            for exam in exam_types:
                # Check if grade already exists
                existing = db.query(models.Grade).filter(
                    models.Grade.enrollment_id == enrollment.id,
                    models.Grade.exam_name == exam
                ).first()
                
                if not existing:
                    max_marks = random.choice([50, 75, 100])
                    # Random marks between 50-95% (good student)
                    marks_obtained = random.uniform(max_marks * 0.50, max_marks * 0.95)
                    
                    grade = models.Grade(
                        enrollment_id=enrollment.id,
                        exam_name=exam,
                        max_marks=max_marks,
                        marks_obtained=round(marks_obtained, 1)
                    )
                    db.add(grade)
                    grade_records.append(grade)
        
        db.flush()
        print(f"✓ Created {len(grade_records)} new grade records")
        
        # ==================== STEP 8: Create Fee Records ====================
        fee_records = []
        
        # Semester 1 fees (paid)
        fee1 = db.query(models.FeeRecord).filter(
            models.FeeRecord.student_id == profile.id,
            models.FeeRecord.status == "paid"
        ).first()
        
        if not fee1:
            fee1 = models.FeeRecord(
                student_id=profile.id,
                amount_due=50000,
                amount_paid=50000,
                due_date=today - timedelta(days=180),
                status="paid",
                paid_at=today - timedelta(days=170)
            )
            db.add(fee1)
            fee_records.append(fee1)
        
        # Semester 2 fees (partially pending)
        fee2 = db.query(models.FeeRecord).filter(
            models.FeeRecord.student_id == profile.id,
            models.FeeRecord.status == "pending"
        ).first()
        
        if not fee2:
            fee2 = models.FeeRecord(
                student_id=profile.id,
                amount_due=50000,
                amount_paid=25000,
                due_date=today + timedelta(days=30),
                status="pending",
                paid_at=None
            )
            db.add(fee2)
            fee_records.append(fee2)
        
        # Semester 3 fees (current, due soon)
        fee3 = db.query(models.FeeRecord).filter(
            models.FeeRecord.student_id == profile.id,
            models.FeeRecord.status == "overdue"
        ).first()
        
        if not fee3:
            fee3 = models.FeeRecord(
                student_id=profile.id,
                amount_due=50000,
                amount_paid=0,
                due_date=today - timedelta(days=10),
                status="overdue",
                paid_at=None
            )
            db.add(fee3)
            fee_records.append(fee3)
        
        db.flush()
        print(f"✓ Created {len(fee_records)} new fee records")
        
        # ==================== STEP 9: Commit All Changes ====================
        db.commit()
        
        # ==================== SUMMARY ====================
        print("\n✅ Student Dashboard Seeded Successfully!")
        print(f"\nTest Student Details:")
        print(f"  Email: {student_email}")
        print(f"  Password: student123")
        print(f"  Name: {user.name}")
        print(f"  Roll No: {profile.roll_no}")
        print(f"  Branch: {branch.name}")
        print(f"  Semester: {semester.semester_number}")
        
        print(f"\nData Summary:")
        print(f"  ✓ Courses: {len(courses)}")
        print(f"  ✓ Enrollments: {len(all_enrollments)}")
        print(f"  ✓ Attendance Records: {len(attendance_records)} new")
        print(f"  ✓ Grade Records: {len(grade_records)} new")
        print(f"  ✓ Fee Records: {len(fee_records)} new")
        
        print(f"\n📊 Dashboard Ready!")
        print(f"Login at: http://localhost:8000/login")
        print(f"Then navigate to: /student/dashboard")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_student_dashboard()
