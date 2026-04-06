# Fix 10 + Features A through G

print("=== Building All Features ===")

from sqlalchemy import text
from app.database import SessionLocal, engine
from app import models

# ==================== FIX 10: Attendance Migration ====================
print("\n=== Fix 10: Adding subject_id and marked_by to attendance ===")
db = SessionLocal()
try:
    # Check and add subject_id column
    result = engine.connect().execute(text("PRAGMA table_info(attendance)"))
    columns = [row[1] for row in result]
    
    if 'subject_id' not in columns:
        engine.connect().execute(text("ALTER TABLE attendance ADD COLUMN subject_id INTEGER"))
        print("Added subject_id column")
    
    if 'marked_by' not in columns:
        engine.connect().execute(text("ALTER TABLE attendance ADD COLUMN marked_by INTEGER"))
        print("Added marked_by column")
        
except Exception as e:
    print(f"Attendance migration: {e}")
finally:
    db.close()

# ==================== FEATURE A: Subject Management ====================
print("\n=== Feature A: Subjects Table ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            branch_id INTEGER REFERENCES branches(id),
            semester_id INTEGER REFERENCES semesters(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Subjects table created")
except Exception as e:
    print(f"Subjects table: {e}")

# Add Subject model
with open('app/models.py', 'r') as f:
    content = f.read()

if 'class Subject' not in content:
    subject_model = '''

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch")
    semester = relationship("Semester")
'''
    content = content + subject_model
    with open('app/models.py', 'w') as f:
        f.write(content)
    print("Subject model added")

# ==================== FEATURE B: Teacher Subject Assignment ====================
print("\n=== Feature B: Teacher subject_id ===")
try:
    # Add subject_id to teacher_profiles
    result = engine.connect().execute(text("PRAGMA table_info(teacher_profiles)"))
    columns = [row[1] for row in result]
    
    if 'subject_id' not in columns:
        engine.connect().execute(text("ALTER TABLE teacher_profiles ADD COLUMN subject_id INTEGER"))
        print("Added subject_id to teacher_profiles")
except Exception as e:
    print(f"Teacher subject_id: {e}")

# ==================== FEATURE C: Fee Structure ====================
print("\n=== Feature C: Fee Structure ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS fee_structures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_id INTEGER REFERENCES branches(id),
            semester_id INTEGER REFERENCES semesters(id),
            total_amount REAL NOT NULL,
            academic_year TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Fee structures table created")
except Exception as e:
    print(f"Fee structures: {e}")

# Add FeeStructure model
if 'class FeeStructure' not in content:
    fee_model = '''

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    total_amount = Column(Float, nullable=False)
    academic_year = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch")
    semester = relationship("Semester")
'''
    content = content + fee_model
    with open('app/models.py', 'w') as f:
        f.write(content)
    print("FeeStructure model added")

# ==================== FEATURE G: Notifications ====================
print("\n=== Feature G: Notifications ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER REFERENCES student_profiles(id),
            message TEXT NOT NULL,
            link TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Notifications table created")
except Exception as e:
    print(f"Notifications: {e}")

# Add Notification model
if 'class Notification' not in content:
    notif_model = '''

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    message = Column(Text, nullable=False)
    link = Column(String(200))
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")
'''
    content = content + notif_model
    with open('app/models.py', 'w') as f:
        f.write(content)
    print("Notification model added")

print("\n=== All Tables and Models Created ===")
