# Features H through O - Table Creation

print("=== Building Features H through O ===")

from sqlalchemy import text
from app.database import SessionLocal, engine
from app import models

# ==================== FEATURE H: Leave Applications ====================
print("\n=== Feature H: Leave Applications ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS leave_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER REFERENCES student_profiles(id),
            from_date DATE NOT NULL,
            to_date DATE NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            reviewed_by INTEGER REFERENCES users(id),
            reviewed_at TIMESTAMP,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Leave applications table created")
except Exception as e:
    print(f"Leave applications: {e}")

# Add LeaveApplication model
with open('app/models.py', 'r') as f:
    content = f.read()

if 'class LeaveApplication' not in content:
    leave_model = '''

class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")
'''
    content = content + leave_model
    with open('app/models.py', 'w') as f:
        f.write(content)
    print("LeaveApplication model added")

# ==================== FEATURE I: Study Materials ====================
print("\n=== Feature I: Study Materials ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS study_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            subject_id INTEGER REFERENCES subjects(id),
            branch_id INTEGER REFERENCES branches(id),
            semester_id INTEGER REFERENCES semesters(id),
            uploaded_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Study materials table created")
except Exception as e:
    print(f"Study materials: {e}")

if 'class StudyMaterial' not in content:
    study_model = '''

class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(200), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject")
    branch = relationship("Branch")
    semester = relationship("Semester")
'''
    content = content + study_model
    with open('app/models.py', 'w') as f:
        f.write(content)
    print("StudyMaterial model added")

# ==================== FEATURE J: Academic Years ====================
print("\n=== Feature J: Academic Years ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS academic_years (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            is_active INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Academic years table created")
except Exception as e:
    print(f"Academic years: {e}")

# ==================== FEATURE K: Audit Logs ====================
print("\n=== Feature K: Audit Logs ===")
try:
    engine.connect().execute(text("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            user_name TEXT,
            action TEXT NOT NULL,
            target_table TEXT,
            target_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    print("Audit logs table created")
except Exception as e:
    print(f"Audit logs: {e}")

if 'class AuditLog' not in content:
    audit_model = '''

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String(120))
    action = Column(String(100), nullable=False)
    target_table = Column(String(50))
    target_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
'''
    content = content + audit_model
    with open('app/models.py', 'w') as f:
        f.write(content)
    print("AuditLog model added")

print("\n=== All Tables and Models for H through O Created ===")
