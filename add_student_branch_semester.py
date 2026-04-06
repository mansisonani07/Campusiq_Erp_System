"""Step 1: Add branch_id and semester_id to student_profiles table"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app import models
from sqlalchemy import text

db = SessionLocal()

try:
    print("=== Adding branch_id and semester_id columns to student_profiles ===")
    
    # Add branch_id column
    try:
        db.execute(text("ALTER TABLE student_profiles ADD COLUMN branch_id INTEGER REFERENCES branches(id)"))
        print("Added branch_id column")
    except Exception as e:
        print(f"branch_id: {e}")
    
    # Add semester_id column
    try:
        db.execute(text("ALTER TABLE student_profiles ADD COLUMN semester_id INTEGER REFERENCES semesters(id)"))
        print("Added semester_id column")
    except Exception as e:
        print(f"semester_id: {e}")
    
    # Now update existing students with branch_id and semester_id based on their department and year
    print("\n=== Updating existing students with branch/semester mapping ===")
    
    # Get all students
    students = db.query(models.StudentProfile).all()
    
    for student in students:
        # Find matching branch by department name
        branch = db.query(models.Branch).filter(
            models.Branch.name.ilike(f"%{student.department}%")
        ).first()
        
        if branch:
            student.branch_id = branch.id
            
            # Find matching semester by semester_number = year
            semester = db.query(models.Semester).filter(
                models.Semester.branch_id == branch.id,
                models.Semester.semester_number == student.year
            ).first()
            
            if semester:
                student.semester_id = semester.id
                print(f"Student {student.roll_no}: branch={branch.name}, semester={semester.semester_number}")
            else:
                # Create semester if not exists
                semester = models.Semester(
                    branch_id=branch.id,
                    semester_number=student.year,
                    academic_year="2025-26"
                )
                db.add(semester)
                db.flush()
                student.semester_id = semester.id
                print(f"Student {student.roll_no}: created semester {student.year} for branch {branch.name}")
        else:
            print(f"Warning: No branch found for student {student.roll_no} with department {student.department}")
    
    db.commit()
    print("\n=== Migration complete ===")
    
    # Verify
    students = db.query(models.StudentProfile).limit(5).all()
    print("\nSample students:")
    for s in students:
        print(f"  {s.roll_no}: branch_id={s.branch_id}, semester_id={s.semester_id}")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
