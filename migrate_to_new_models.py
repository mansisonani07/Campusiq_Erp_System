"""
Migration script to create new database tables
Run this to create all the new tables
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models_new import (
    Branch, Semester, Subject, User, Student, Teacher,
    Attendance, Result, Fee, Circular, Notice, 
    Timetable, ExamSchedule, LoginOTP, SiteSetting
)

def migrate():
    print("Creating new database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("Tables created successfully!")
    print("\nNew tables created:")
    print("- branches")
    print("- semesters")
    print("- subjects")
    print("- users (updated)")
    print("- students")
    print("- teachers")
    print("- attendance")
    print("- results")
    print("- fees")
    print("- circulars")
    print("- notices")
    print("- timetables")
    print("- exam_schedules")
    print("- login_otps")
    print("- site_settings")

if __name__ == "__main__":
    migrate()
