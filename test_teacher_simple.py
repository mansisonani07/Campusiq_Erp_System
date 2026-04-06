"""Simple test without httpx - check the code logic directly"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app import models

def check_teacher_exists():
    """Check if teacher user exists in database"""
    print("\n=== Check: Teacher user exists ===")
    db = SessionLocal()
    try:
        teacher = db.query(models.User).filter(models.User.email == "teacher@erp.local").first()
        if teacher:
            print(f"✓ Teacher exists: {teacher.email}, role: {teacher.role}")
            
            # Check teacher profile
            profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == teacher.id).first()
            if profile:
                print(f"  - Branch ID: {profile.branch_id}, Semester ID: {profile.semester_id}")
                
                # Check branch
                branch = db.query(models.Branch).filter(models.Branch.id == profile.branch_id).first()
                if branch:
                    print(f"  - Branch: {branch.name}")
                
                # Check semester
                semester = db.query(models.Semester).filter(models.Semester.id == profile.semester_id).first()
                if semester:
                    print(f"  - Semester: {semester.semester_number}")
                
                return True
            else:
                print("✗ No teacher profile found")
                return False
        else:
            print("✗ Teacher user not found")
            return False
    finally:
        db.close()


def check_notices_filtering():
    """Check notice filtering logic"""
    print("\n=== Check: Notice filtering for teacher ===")
    db = SessionLocal()
    try:
        all_notices = db.query(models.Notice).all()
        print(f"Total notices: {len(all_notices)}")
        
        for notice in all_notices[:5]:
            print(f"  - {notice.title[:30]}... target_role: {notice.target_role}")
        
        # Student-only notices
        student_notices = db.query(models.Notice).filter(models.Notice.target_role == "student").all()
        print(f"Student-only notices: {len(student_notices)}")
        
        # Teacher/All notices
        teacher_notices = db.query(models.Notice).filter(
            models.Notice.target_role.in_(["all", "teacher"])
        ).all()
        print(f"Teacher/All notices: {len(teacher_notices)}")
        
        return True
    finally:
        db.close()


def check_students_by_branch_semester():
    """Check students filtered by branch and semester"""
    print("\n=== Check: Students by branch/semester ===")
    db = SessionLocal()
    try:
        # Get teacher profile
        teacher = db.query(models.User).filter(models.User.email == "teacher@erp.local").first()
        if not teacher:
            print("✗ Teacher not found")
            return False
        
        profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == teacher.id).first()
        if not profile:
            print("✗ Teacher profile not found")
            return False
        
        branch = db.query(models.Branch).filter(models.Branch.id == profile.branch_id).first()
        semester = db.query(models.Semester).filter(models.Semester.id == profile.semester_id).first()
        
        if not branch or not semester:
            print("✗ Branch or Semester not found")
            return False
        
        # Get students in teacher's class
        students = db.query(models.StudentProfile).filter(
            models.StudentProfile.department == branch.name,
            models.StudentProfile.year == semester.semester_number
        ).all()
        
        print(f"Students in teacher's class ({branch.name}, Year {semester.semester_number}): {len(students)}")
        
        # Get ALL students
        all_students = db.query(models.StudentProfile).all()
        print(f"ALL students in system: {len(all_students)}")
        
        return True
    finally:
        db.close()


def check_routes():
    """Check that routes are properly set up"""
    print("\n=== Check: Routes ===")
    from app.main import app
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(route.path)
    
    teacher_routes = [r for r in routes if '/teacher' in r]
    print(f"Teacher routes: {len(teacher_routes)}")
    for r in teacher_routes:
        print(f"  - {r}")
    
    return True


if __name__ == "__main__":
    print("="*60)
    print("TEACHER FUNCTIONALITY CHECKS")
    print("="*60)
    
    check_teacher_exists()
    check_notices_filtering()
    check_students_by_branch_semester()
    check_routes()
    
    print("\n" + "="*60)
    print("Checks complete - review output above")
    print("="*60)
