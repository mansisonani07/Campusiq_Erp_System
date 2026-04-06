"""
Database Seeder for Student ERP System
Run this file to populate the database with realistic sample data.
"""
from datetime import date, datetime, timedelta
import random
from app.database import SessionLocal
from app import models
from app.auth import hash_password

def seed_database(force: bool = False):
    from app.database import Base, engine
    
    # Create all tables first
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_students = db.query(models.StudentProfile).count()
        if existing_students > 0 and not force:
            print(f"Database already has {existing_students} students. Skipping seed.")
            return
        
        # If force, clear existing data
        if force and existing_students > 0:
            print("Force re-seeding: Clearing existing data...")
            db.query(models.Intervention).delete()
            db.query(models.Grade).delete()
            db.query(models.Attendance).delete()
            db.query(models.Enrollment).delete()
            db.query(models.FeeRecord).delete()
            db.query(models.Assessment).delete()
            db.query(models.Announcement).delete()
            db.query(models.StudentProfile).delete()
            db.query(models.StudentExtraDetail).delete()
            db.query(models.Course).delete()
            db.query(models.User).filter(models.User.role == "student").delete()
            db.query(models.User).filter(models.User.role.in_(["admin", "teacher", "accountant", "counselor"])).delete(synchronize_session=False)
            db.commit()
            print("Existing data cleared.")
        
        print("Seeding database with realistic data...")
        
        # Create Staff/Users
        staff_data = [
            ("Dr. Rajesh Kumar", "principal@erp.local", "principal123", "admin"),
            ("Mrs. Sunita Devi", "sunita@erp.local", "teacher123", "teacher"),
            ("Mr. Raj Malhotra", "raj@erp.local", "teacher234", "teacher"),
            ("Mr. Amit Sharma", "amit@erp.local", "admin123", "admin"),
            ("Ms. Pooja Singh", "pooja@erp.local", "account123", "accountant"),
            ("Mr. Vikram Joshi", "vikram@erp.local", "counsel123", "counselor"),
        ]
        
        staff_users = []
        for name, email, password, role in staff_data:
            user = models.User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role=role
            )
            db.add(user)
            staff_users.append(user)
        
        db.flush()
        print(f"Created {len(staff_users)} staff users")
        
        # Create Courses
        courses_data = [
            ("CS101", "Introduction to Programming", 4, "Sem 1"),
            ("CS201", "Data Structures", 4, "Sem 3"),
            ("CS301", "Database Management Systems", 3, "Sem 5"),
            ("CS401", "Algorithms", 4, "Sem 7"),
            ("MA101", "Calculus I", 4, "Sem 1"),
            ("MA201", "Linear Algebra", 3, "Sem 3"),
            ("PH101", "Physics I", 4, "Sem 1"),
            ("CS501", "Machine Learning", 3, "Sem 7"),
        ]
        
        courses = []
        for code, title, credits, semester in courses_data:
            course = models.Course(code=code, title=title, credits=credits, semester=semester)
            db.add(course)
            courses.append(course)
        
        db.flush()
        print(f"Created {len(courses)} courses")
        
        # Create Students
        students_data = [
            ("Rahul Sharma", "rahul@erp.local", "STU1001", "Computer Science", 2, "9876543210", "Ramesh Sharma"),
            ("Priya Singh", "priya@erp.local", "STU1002", "Computer Science", 2, "9876543211", "Ajay Singh"),
            ("Amit Patel", "amitp@erp.local", "STU1003", "Information Technology", 3, "9876543212", "Bharat Patel"),
            ("Sneha Gupta", "sneha@erp.local", "STU1004", "Computer Science", 1, "9876543213", "Sanjeev Gupta"),
            ("Rohan Mehta", "rohan@erp.local", "STU1005", "Computer Science", 4, "9876543214", "Hemant Mehta"),
            ("Kavya Reddy", "kavya@erp.local", "STU1006", "Information Technology", 2, "9876543215", "Anil Reddy"),
            ("Arjun Nair", "arjun@erp.local", "STU1007", "Computer Science", 3, "9876543216", "Madhavan Nair"),
            ("Pooja Joshi", "poojaj@erp.local", "STU1008", "Electronics", 1, "9876543217", "Suresh Joshi"),
            ("Vikram Shah", "vikrams@erp.local", "STU1009", "Computer Science", 4, "9876543218", "Dinesh Shah"),
            ("Neha Verma", "neha@erp.local", "STU1010", "Information Technology", 2, "9876543219", "Ravi Verma"),
            ("Karan Malhotra", "karan@erp.local", "STU1011", "Computer Science", 3, "9876543220", "Vijay Malhotra"),
            ("Ananya Das", "ananya@erp.local", "STU1012", "Electronics", 1, "9876543221", "Subrata Das"),
            ("Siddharth Rao", "siddharth@erp.local", "STU1013", "Computer Science", 4, "9876543222", "Srinivas Rao"),
            ("Divya Kumar", "divya@erp.local", "STU1014", "Information Technology", 2, "9876543223", "Prakash Kumar"),
            ("Mohit Agarwal", "mohit@erp.local", "STU1015", "Computer Science", 3, "9876543224", "Anil Agarwal"),
        ]
        
        student_users = []
        student_profiles = []
        
        for name, email, roll_no, dept, year, phone, guardian in students_data:
            user = models.User(
                name=name,
                email=email,
                password_hash=hash_password("student123"),
                role="student"
            )
            db.add(user)
            db.flush()
            
            profile = models.StudentProfile(
                user_id=user.id,
                roll_no=roll_no,
                department=dept,
                year=year,
                phone=phone,
                guardian_name=guardian
            )
            db.add(profile)
            student_users.append(user)
            student_profiles.append(profile)
        
        db.flush()
        print(f"Created {len(student_profiles)} students")
        
        # Create Enrollments (each student enrolled in 4-6 courses)
        enrollment_count = 0
        for profile in student_profiles:
            num_courses = random.randint(4, 6)
            selected_courses = random.sample(courses, num_courses)
            for course in selected_courses:
                enrollment = models.Enrollment(
                    student_id=profile.id,
                    course_id=course.id
                )
                db.add(enrollment)
                enrollment_count += 1
        
        db.flush()
        print(f"Created {enrollment_count} enrollments")
        
        # Create Attendance (last 30 days)
        today = date.today()
        attendance_records = []
        
        for profile in student_profiles:
            enrollments = db.query(models.Enrollment).filter(models.Enrollment.student_id == profile.id).all()
            
            # Generate attendance for last 30 days
            for days_ago in range(30):
                att_date = today - timedelta(days=days_ago)
                
                # Skip weekends
                if att_date.weekday() >= 5:
                    continue
                
                # Random attendance (70-95% present rate)
                for enrollment in enrollments:
                    present_probability = random.uniform(0.70, 0.95)
                    status = "present" if random.random() < present_probability else "absent"
                    
                    att = models.Attendance(
                        enrollment_id=enrollment.id,
                        date=att_date,
                        status=status
                    )
                    db.add(att)
                    attendance_records.append(att)
        
        db.flush()
        print(f"Created {len(attendance_records)} attendance records")
        
        # Create Grades/Assessments
        grade_records = []
        exam_types = ["Mid Term", "End Term", "Unit Test 1", "Unit Test 2", "Quiz"]
        
        for profile in student_profiles:
            enrollments = db.query(models.Enrollment).filter(models.Enrollment.student_id == profile.id).all()
            
            for enrollment in enrollments:
                # Random grades for different exams
                num_exams = random.randint(2, 4)
                selected_exams = random.sample(exam_types, num_exams)
                
                for exam in selected_exams:
                    max_marks = random.choice([50, 75, 100])
                    # Random marks between 40-95%
                    marks_obtained = random.uniform(max_marks * 0.4, max_marks * 0.95)
                    
                    grade = models.Grade(
                        enrollment_id=enrollment.id,
                        exam_name=exam,
                        max_marks=max_marks,
                        marks_obtained=round(marks_obtained, 1)
                    )
                    db.add(grade)
                    grade_records.append(grade)
        
        db.flush()
        print(f"Created {len(grade_records)} grade records")
        
        # Create Fee Records
        fee_statuses = ["paid", "pending", "overdue"]
        fee_status_weights = [0.4, 0.35, 0.25]  # 40% paid, 35% pending, 25% overdue
        
        for profile in student_profiles:
            # Each student has 1-2 fee records
            num_fees = random.randint(1, 2)
            
            for semester in range(1, num_fees + 1):
                amount_due = random.randint(25000, 75000)
                status = random.choices(fee_statuses, weights=fee_status_weights)[0]
                
                # Calculate amount paid based on status
                if status == "paid":
                    amount_paid = amount_due
                    due_date = today - timedelta(days=random.randint(30, 180))
                    paid_at = due_date - timedelta(days=random.randint(1, 10))
                elif status == "pending":
                    amount_paid = random.randint(0, amount_due // 2)
                    due_date = today + timedelta(days=random.randint(1, 60))
                    paid_at = None
                else:  # overdue
                    amount_paid = random.randint(0, amount_due // 3)
                    due_date = today - timedelta(days=random.randint(1, 90))
                    paid_at = None
                
                fee = models.FeeRecord(
                    student_id=profile.id,
                    amount_due=amount_due,
                    amount_paid=amount_paid,
                    due_date=due_date,
                    status=status,
                    paid_at=paid_at
                )
                db.add(fee)
        
        db.flush()
        print(f"Created fee records for all students")
        
        # Create Announcements
        announcements_data = [
            ("Welcome to CampusIQ", "Welcome to the new Academic Year 2025-26! All students can now track attendance, fees, and grades online.", "all"),
            ("Mid Term Examinations", "Mid-term examinations will be held from March 15-25, 2025. Check your exam schedule.", "all"),
            ("Fee Payment Reminder", "Last date for fee payment for Semester 2 is approaching. Please clear your dues.", "students"),
            ("Holiday Notice", "The institute will remain closed on account of Holi on March 14, 2025.", "all"),
            ("Results Declaration", "End Term results have been declared. Students can view their marks in the student portal.", "students"),
            ("Parent-Teacher Meeting", "A parent-teacher meeting is scheduled for March 30, 2025. Parents are requested to attend.", "students"),
            ("Library Notice", "New books have been added to the library. Students can issue up to 3 books at a time.", "all"),
            ("Technical Workshop", "A workshop on AI and Machine Learning will be conducted next week. Interested students can register.", "all"),
        ]
        
        for title, body, audience in announcements_data:
            announcement = models.Announcement(
                title=title,
                body=body,
                audience=audience
            )
            db.add(announcement)
        
        db.flush()
        print(f"Created {len(announcements_data)} announcements")
        
        # Create Interventions (Risk cases)
        for profile in student_profiles:
            # Calculate risk based on attendance
            total_att = db.query(models.Attendance).join(models.Enrollment).filter(
                models.Enrollment.student_id == profile.id
            ).count()
            
            if total_att > 0:
                present_att = db.query(models.Attendance).join(models.Enrollment).filter(
                    models.Enrollment.student_id == profile.id,
                    models.Attendance.status == "present"
                ).count()
                
                attendance_pct = (present_att / total_att) * 100
                
                # Create intervention if attendance is low
                if attendance_pct < 75:
                    risk_score_val = round(100 - attendance_pct, 1)
                    recommendation = "Urgent mentor call, guardian meeting required."
                    
                    intervention = models.Intervention(
                        student_id=profile.id,
                        risk_score=risk_score_val,
                        recommendation=recommendation,
                        resolved="no"
                    )
                    db.add(intervention)
        
        db.flush()
        print("Created intervention records for at-risk students")
        
        # Create Assessments
        assessments_data = []
        for course in courses[:6]:  # Only first 6 courses
            for month in range(1, 4):  # 3 assessments per course
                assessment_date = today + timedelta(days=random.randint(7, 90))
                assessment = models.Assessment(
                    course_id=course.id,
                    title=f"{course.code} - Assessment {month}",
                    date=assessment_date
                )
                db.add(assessment)
                assessments_data.append(assessment)
        
        db.flush()
        print(f"Created {len(assessments_data)} assessments")
        
        db.commit()
        print("\n✅ Database seeded successfully!")
        print(f"Summary:")
        print(f"  - Staff Users: {len(staff_users)}")
        print(f"  - Students: {len(student_profiles)}")
        print(f"  - Courses: {len(courses)}")
        print(f"  - Enrollments: {enrollment_count}")
        print(f"  - Attendance Records: {len(attendance_records)}")
        print(f"  - Grade Records: {len(grade_records)}")
        print(f"  - Announcements: {len(announcements_data)}")
        print(f"  - Assessments: {len(assessments_data)}")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database(force=True)
