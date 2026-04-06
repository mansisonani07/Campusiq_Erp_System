from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import RedirectResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os
from datetime import date
from urllib.parse import parse_qs

from app.database import Base, engine, SessionLocal
from app.routers import public, admin, student, teacher, search, teacher_api, analytics, expenses
from app.models import User, StudentProfile, Course, Enrollment, Attendance, Grade, FeeRecord, Announcement, SiteSetting, Assessment
from app.auth import hash_password
from app.permissions import has_permission
from app.session import (
    get_session_user_id,
    session_expired,
    touch_user_session,
    clear_user_session,
    get_or_create_csrf_token,
    validate_csrf_token,
    session_age_minutes,
)
from sqlalchemy import inspect, text

load_dotenv()

app = FastAPI(title="Student ERP System", version="1.0.0")

# Configure logging to show OTP messages in terminal
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
SESSION_IDLE_TIMEOUT_MINUTES = int(os.getenv("SESSION_IDLE_TIMEOUT_MINUTES", "120"))
REMEMBER_IDLE_TIMEOUT_MINUTES = int(os.getenv("REMEMBER_IDLE_TIMEOUT_MINUTES", "10080"))
NON_REMEMBER_MAX_AGE_MINUTES = int(os.getenv("NON_REMEMBER_MAX_AGE_MINUTES", "720"))
REMEMBER_MAX_AGE_MINUTES = int(os.getenv("REMEMBER_MAX_AGE_MINUTES", "43200"))
COOKIE_MAX_AGE_SECONDS = int(os.getenv("COOKIE_MAX_AGE_SECONDS", "86400"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAME_SITE = os.getenv("COOKIE_SAME_SITE", "lax")
COOKIE_NAME = os.getenv("COOKIE_NAME", "student_erp_session")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.state.templates = Jinja2Templates(directory="app/templates")
app.state.templates.env.globals["has_permission"] = has_permission


def template_csrf_token(request: Request) -> str:
    return get_or_create_csrf_token(request)


def template_session(request: Request):
    

    return request.session


app.state.templates.env.globals["csrf_token"] = template_csrf_token


from starlette.middleware.base import BaseHTTPMiddleware


class SessionGuardMiddleware(BaseHTTPMiddleware):
    # Routes that don't require CSRF validation
    CSRF_EXEMPT_ROUTES = {"/login-simple", "/login", "/register", "/forgot-password", "/reset-password", "/verify-otp", "/approve-device", "/auth/google/start"}
    
    def _is_csrf_exempt(self, path: str) -> bool:
        # Check exact match or prefix match for public API routes
        if path in self.CSRF_EXEMPT_ROUTES:
            return True
        # Also exempt if path starts with these public routes
        for exempt_path in self.CSRF_EXEMPT_ROUTES:
            if path.startswith(exempt_path):
                return True
        return False

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        protected = path.startswith("/admin") or path.startswith("/student") or path.startswith("/teacher")
        is_static = path.startswith("/static")
        csrf_exempt = self._is_csrf_exempt(path)
        get_or_create_csrf_token(request)

        # Always parse form data for POST requests so route handlers can access it
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and not is_static:
            content_type = request.headers.get("content-type", "")
            if "application/x-www-form-urlencoded" in content_type:
                body_text = (await request.body()).decode("utf-8", errors="ignore")
                # Re-create the body stream so downstream handlers can read it
                async def receive():
                    return {"type": "http.request", "body": body_text.encode("utf-8")}
                request._receive = receive
                parsed = parse_qs(body_text)
                # Store parsed form data in request.state for route handlers
                request.state.form = parsed
                
                # Only validate CSRF for non-exempt routes
                if not csrf_exempt:
                    submitted_token = request.headers.get("X-CSRF-Token")
                    token_values = parsed.get("csrf_token", [])
                    submitted_token = token_values[0] if token_values else None
                    if not validate_csrf_token(request.session, submitted_token):
                        return PlainTextResponse("CSRF validation failed", status_code=403)

        user_id = get_session_user_id(request.session)

        if user_id:
            remember_me = request.session.get("remember_me") == "yes"
            max_age_minutes = REMEMBER_MAX_AGE_MINUTES if remember_me else NON_REMEMBER_MAX_AGE_MINUTES
            current_age = session_age_minutes(request.session)
            if current_age is None or current_age > max_age_minutes:
                clear_user_session(request)
                if protected:
                    return RedirectResponse("/login", status_code=303)
                return await call_next(request)

            effective_idle_timeout = REMEMBER_IDLE_TIMEOUT_MINUTES if remember_me else SESSION_IDLE_TIMEOUT_MINUTES
            if session_expired(request.session, effective_idle_timeout):
                clear_user_session(request)
                if protected:
                    return RedirectResponse("/login", status_code=303)
            else:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                finally:
                    db.close()
                if not user:
                    clear_user_session(request)
                    if protected:
                        return RedirectResponse("/login", status_code=303)
                else:
                    request.state.current_user = user
                    user_role = (user.role or "").strip().lower()
                    request.state.current_role = user_role
                    request.session["role"] = user_role
                    if path.startswith("/student") and user_role != "student":
                        return RedirectResponse("/login?msg=Access denied for student portal.", status_code=303)
                    if path.startswith("/teacher") and user_role != "teacher":
                        return RedirectResponse("/login?msg=Access denied for teacher portal.", status_code=303)
                    if path.startswith("/admin") and user_role not in ["admin", "accountant", "counselor"]:
                        return RedirectResponse("/login?msg=Access denied for admin portal.", status_code=303)
                    touch_user_session(request)

        elif protected:
            return RedirectResponse("/login", status_code=303)

        response = await call_next(request)
        return response


# Note: Middleware order matters! SessionMiddleware must be added first (outermost)
# because Starlette processes middleware in reverse order
app.add_middleware(SessionGuardMiddleware)
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "change-me"), session_cookie=COOKIE_NAME, max_age=COOKIE_MAX_AGE_SECONDS, same_site=COOKIE_SAME_SITE, https_only=COOKIE_SECURE)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        inspector = inspect(db.bind)
        dialect = db.bind.dialect.name if db.bind else "sqlite"
        ts_type = "TIMESTAMP" if dialect == "postgresql" else "DATETIME"
        fee_cols = {col["name"] for col in inspector.get_columns("fee_records")}
        if "paid_at" not in fee_cols:
            db.execute(text(f"ALTER TABLE fee_records ADD COLUMN paid_at {ts_type}"))
        if "created_at" not in fee_cols:
            db.execute(text(f"ALTER TABLE fee_records ADD COLUMN created_at {ts_type}"))

        enroll_cols = {col["name"] for col in inspector.get_columns("enrollments")}
        if "created_at" not in enroll_cols:
            db.execute(text(f"ALTER TABLE enrollments ADD COLUMN created_at {ts_type}"))
        
        # Add columns for subjects table if missing
        try:
            subject_cols = {col["name"] for col in inspector.get_columns("subjects")}
            if "name" not in subject_cols:
                db.execute(text(f"ALTER TABLE subjects ADD COLUMN name VARCHAR(120)"))
            if "code" not in subject_cols:
                db.execute(text(f"ALTER TABLE subjects ADD COLUMN code VARCHAR(20)"))
            if "branch_id" not in subject_cols:
                db.execute(text(f"ALTER TABLE subjects ADD COLUMN branch_id INTEGER REFERENCES branches(id)"))
            if "semester_id" not in subject_cols:
                db.execute(text(f"ALTER TABLE subjects ADD COLUMN semester_id INTEGER REFERENCES semesters(id)"))
            if "created_at" not in subject_cols:
                db.execute(text(f"ALTER TABLE subjects ADD COLUMN created_at {ts_type}"))
        except:
            pass  # Table might not exist yet
        
        # Add columns for transport_routes table if missing
        try:
            transport_cols = {col["name"] for col in inspector.get_columns("transport_routes")}
            if "route_name" not in transport_cols:
                db.execute(text(f"ALTER TABLE transport_routes ADD COLUMN route_name VARCHAR(100)"))
            if "bus_number" not in transport_cols:
                db.execute(text(f"ALTER TABLE transport_routes ADD COLUMN bus_number VARCHAR(50)"))
            if "departure_time" not in transport_cols:
                db.execute(text(f"ALTER TABLE transport_routes ADD COLUMN departure_time VARCHAR(50)"))
            if "stops" not in transport_cols:
                db.execute(text(f"ALTER TABLE transport_routes ADD COLUMN stops TEXT"))
        except:
            pass
        
        # Add columns for hostel_rooms table if missing
        try:
            hostel_cols = {col["name"] for col in inspector.get_columns("hostel_rooms")}
            if "room_number" not in hostel_cols:
                db.execute(text(f"ALTER TABLE hostel_rooms ADD COLUMN room_number VARCHAR(20)"))
            if "floor" not in hostel_cols:
                db.execute(text(f"ALTER TABLE hostel_rooms ADD COLUMN floor INTEGER"))
            if "capacity" not in hostel_cols:
                db.execute(text(f"ALTER TABLE hostel_rooms ADD COLUMN capacity INTEGER"))
            if "current_occupancy" not in hostel_cols:
                db.execute(text(f"ALTER TABLE hostel_rooms ADD COLUMN current_occupancy INTEGER"))
        except:
            pass
        
        # Add columns for timetables table if missing
        try:
            timetable_cols = {col["name"] for col in inspector.get_columns("timetables")}
            if "file_path" not in timetable_cols:
                db.execute(text(f"ALTER TABLE timetables ADD COLUMN file_path VARCHAR(255)"))
            if "file_name" not in timetable_cols:
                db.execute(text(f"ALTER TABLE timetables ADD COLUMN file_name VARCHAR(255)"))
            if "uploaded_at" not in timetable_cols:
                db.execute(text(f"ALTER TABLE timetables ADD COLUMN uploaded_at {ts_type}"))
        except:
            pass
        
        # Add columns for exam_schedules table if missing
        try:
            exam_cols = {col["name"] for col in inspector.get_columns("exam_schedules")}
            if "subject_name" not in exam_cols:
                db.execute(text(f"ALTER TABLE exam_schedules ADD COLUMN subject_name VARCHAR(120)"))
            if "exam_date" not in exam_cols:
                db.execute(text(f"ALTER TABLE exam_schedules ADD COLUMN exam_date DATE"))
            if "exam_time" not in exam_cols:
                db.execute(text(f"ALTER TABLE exam_schedules ADD COLUMN exam_time VARCHAR(50)"))
            if "created_at" not in exam_cols:
                db.execute(text(f"ALTER TABLE exam_schedules ADD COLUMN created_at {ts_type}"))
        except:
            pass
        
        # Add columns for fee_structures table if missing
        try:
            fee_struct_cols = {col["name"] for col in inspector.get_columns("fee_structures")}
            if "branch_id" not in fee_struct_cols:
                db.execute(text(f"ALTER TABLE fee_structures ADD COLUMN branch_id INTEGER"))
            if "semester_id" not in fee_struct_cols:
                db.execute(text(f"ALTER TABLE fee_structures ADD COLUMN semester_id INTEGER"))
            if "total_amount" not in fee_struct_cols:
                db.execute(text(f"ALTER TABLE fee_structures ADD COLUMN total_amount FLOAT"))
            if "academic_year" not in fee_struct_cols:
                db.execute(text(f"ALTER TABLE fee_structures ADD COLUMN academic_year VARCHAR(20)"))
        except:
            pass
        
        # Add columns for study_materials table if missing
        try:
            study_cols = {col["name"] for col in inspector.get_columns("study_materials")}
            if "title" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN title VARCHAR(200)"))
            if "description" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN description TEXT"))
            if "file_path" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN file_path VARCHAR(255)"))
            if "subject" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN subject VARCHAR(100)"))
            if "branch_id" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN branch_id INTEGER"))
            if "semester_id" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN semester_id INTEGER"))
            if "created_at" not in study_cols:
                db.execute(text(f"ALTER TABLE study_materials ADD COLUMN created_at {ts_type}"))
        except:
            pass
        
        # Add columns for leave_applications table if missing
        try:
            leave_cols = {col["name"] for col in inspector.get_columns("leave_applications")}
            if "student_id" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN student_id INTEGER"))
            if "leave_type" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN leave_type VARCHAR(50)"))
            if "reason" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN reason TEXT"))
            if "start_date" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN start_date DATE"))
            if "end_date" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN end_date DATE"))
            if "status" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN status VARCHAR(20)"))
            if "created_at" not in leave_cols:
                db.execute(text(f"ALTER TABLE leave_applications ADD COLUMN created_at {ts_type}"))
        except:
            pass
        
        # Add columns for academic_years table if missing
        try:
            academic_cols = {col["name"] for col in inspector.get_columns("academic_years")}
            if "name" not in academic_cols:
                db.execute(text(f"ALTER TABLE academic_years ADD COLUMN name VARCHAR(50)"))
            if "start_date" not in academic_cols:
                db.execute(text(f"ALTER TABLE academic_years ADD COLUMN start_date DATE"))
            if "end_date" not in academic_cols:
                db.execute(text(f"ALTER TABLE academic_years ADD COLUMN end_date DATE"))
            if "is_active" not in academic_cols:
                db.execute(text(f"ALTER TABLE academic_years ADD COLUMN is_active INTEGER"))
        except:
            pass
        
        # Add columns for audit_logs table if missing
        try:
            audit_cols = {col["name"] for col in inspector.get_columns("audit_logs")}
            if "user_id" not in audit_cols:
                db.execute(text(f"ALTER TABLE audit_logs ADD COLUMN user_id INTEGER"))
            if "action" not in audit_cols:
                db.execute(text(f"ALTER TABLE audit_logs ADD COLUMN action VARCHAR(100)"))
            if "details" not in audit_cols:
                db.execute(text(f"ALTER TABLE audit_logs ADD COLUMN details TEXT"))
            if "ip_address" not in audit_cols:
                db.execute(text(f"ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(50)"))
            if "created_at" not in audit_cols:
                db.execute(text(f"ALTER TABLE audit_logs ADD COLUMN created_at {ts_type}"))
        except:
            pass
        
        # Add columns for results table if missing
        try:
            result_cols = {col["name"] for col in inspector.get_columns("results")}
            if "status" not in result_cols:
                db.execute(text(f"ALTER TABLE results ADD COLUMN status VARCHAR(20)"))
            if "updated_at" not in result_cols:
                db.execute(text(f"ALTER TABLE results ADD COLUMN updated_at {ts_type}"))
        except:
            pass
        
        db.commit()

        # Import models needed for seeding
        from app.models import Branch, Semester, Subject, TransportRoute, HostelRoom, StudyMaterial, TeacherProfile
        
        # Seed Branches if none exist
        if db.query(Branch).count() == 0:
            branches_data = [
                Branch(name="Computer Engineering", code="CE"),
                Branch(name="Information Technology", code="IT"),
                Branch(name="Computer Science", code="CSE"),
                Branch(name="Electronics & Communication", code="EC"),
                Branch(name="Mechanical Engineering", code="ME"),
                Branch(name="Civil Engineering", code="CE"),
            ]
            db.add_all(branches_data)
            db.flush()
            
            # Seed Semesters for each branch
            for branch in db.query(Branch).all():
                for sem in range(1, 9):  # 8 semesters
                    db.add(Semester(branch_id=branch.id, semester_number=sem, academic_year="2025-26"))
            
            # Seed Subjects
            subjects_data = [
                {"name": "Data Structures", "code": "CS201", "branch": "CE", "sem": 3},
                {"name": "Database Management", "code": "CS301", "branch": "CE", "sem": 4},
                {"name": "Operating Systems", "code": "CS401", "branch": "CE", "sem": 5},
                {"name": "Computer Networks", "code": "CS501", "branch": "CE", "sem": 6},
                {"name": "Machine Learning", "code": "CS601", "branch": "CE", "sem": 7},
                {"name": "Web Development", "code": "IT301", "branch": "IT", "sem": 4},
                {"name": "Python Programming", "code": "IT201", "branch": "IT", "sem": 3},
                {"name": "Discrete Mathematics", "code": "MA201", "branch": "CE", "sem": 3},
                {"name": "Engineering Mathematics", "code": "MA301", "branch": "CE", "sem": 4},
                {"name": "Digital Electronics", "code": "EC201", "branch": "EC", "sem": 3},
            ]
            for subj in subjects_data:
                branch = db.query(Branch).filter(Branch.code == subj["branch"]).first()
                sem = db.query(Semester).filter(Semester.branch_id == branch.id, Semester.semester_number == subj["sem"]).first() if branch else None
                db.add(Subject(
                    name=subj["name"],
                    code=subj["code"],
                    branch_id=branch.id if branch else None,
                    semester_id=sem.id if sem else None
                ))
            
            # Seed Transport Routes
            transport_routes = [
                TransportRoute(route_name="Route A - City Center", bus_number="BUS-001", departure_time="7:00 AM", stops="City Center, Mall Road, College Gate"),
                TransportRoute(route_name="Route B - North Campus", bus_number="BUS-002", departure_time="7:15 AM", stops="North Campus, Hostel Block, Main Gate"),
                TransportRoute(route_name="Route C - South Extension", bus_number="BUS-003", departure_time="7:30 AM", stops="South Ext, Residential Area, College Gate"),
                TransportRoute(route_name="Route D - Express", bus_number="BUS-004", departure_time="6:45 AM", stops="Express Way, College Gate"),
                TransportRoute(route_name="Route E - Evening", bus_number="BUS-005", departure_time="4:00 PM", stops="College Gate, City Center, Mall Road"),
            ]
            db.add_all(transport_routes)
            
            # Seed Hostel Rooms
            hostel_rooms = []
            for floor in range(1, 5):
                for room in range(1, 11):
                    hostel_rooms.append(HostelRoom(
                        room_number=f"{floor}0{room}" if room < 10 else f"{floor}{room}",
                        floor=floor,
                        capacity=4,
                        current_occupancy=2 if floor <= 3 else 0
                    ))
            db.add_all(hostel_rooms)
            
            # Seed Study Materials
            study_materials = [
                StudyMaterial(title="Data Structures Lecture Notes", description="Complete notes for Data Structures", file_path="/static/uploads/study-materials/ds_notes.pdf", subject="Data Structures"),
                StudyMaterial(title="Database SQL Queries", description="Practice queries for DBMS", file_path="/static/uploads/study-materials/sql_queries.pdf", subject="Database Management"),
                StudyMaterial(title="OS Process Scheduling", description="CPU scheduling algorithms", file_path="/static/uploads/study-materials/os_scheduling.pdf", subject="Operating Systems"),
                StudyMaterial(title="Python Basics Tutorial", description="Introduction to Python programming", file_path="/static/uploads/study-materials/python_tutorial.pdf", subject="Python Programming"),
                StudyMaterial(title="Network Protocols Guide", description="TCP/IP and OSI model", file_path="/static/uploads/study-materials/network_protocols.pdf", subject="Computer Networks"),
            ]
            db.add_all(study_materials)
            
            db.commit()

        if not db.query(User).filter(User.email == "admin@erp.local").first():
            admin_email = os.getenv("ADMIN_EMAIL", "admin@erp.local").strip().lower()
            admin_user = User(
                name="Super Admin",
                email=admin_email,
                password_hash=hash_password("admin123"),
                role="admin",
            )
            db.add(admin_user)

        seed_staff = [
            (os.getenv("TEACHER_EMAIL", "teacher@erp.local").strip().lower(), "Faculty User", "teacher", "teacher123"),
            (os.getenv("ACCOUNTANT_EMAIL", "accountant@erp.local").strip().lower(), "Accounts User", "accountant", "account123"),
            (os.getenv("COUNSELOR_EMAIL", "counselor@erp.local").strip().lower(), "Counselor User", "counselor", "counsel123"),
        ]
        for email, name, role, password in seed_staff:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(name=name, email=email, password_hash=hash_password(password), role=role))

        # Only create default student if no students exist
        if db.query(StudentProfile).count() == 0:
            student_email = os.getenv("STUDENT_EMAIL", "student@erp.local").strip().lower()
            if not db.query(User).filter(User.email == student_email).first():
                student_user = User(
                    name="Aarav Patel",
                    email=student_email,
                    password_hash=hash_password("student123"),
                    role="student",
                )
                db.add(student_user)
                db.flush()

                profile = StudentProfile(
                    user_id=student_user.id,
                    roll_no="STU-1001",
                    department="Computer Science",
                    year=2,
                    phone="9990001111",
                    guardian_name="Meera Patel",
                )
                db.add(profile)
                db.flush()

                # Only create courses if they don't exist
                course1 = db.query(Course).filter(Course.code == "CS201").first()
                if not course1:
                    course1 = Course(code="CS201", title="Data Structures", credits=4, semester="Sem 3")
                    db.add(course1)
                    db.flush()
                
                course2 = db.query(Course).filter(Course.code == "MA202").first()
                if not course2:
                    course2 = Course(code="MA202", title="Discrete Mathematics", credits=3, semester="Sem 3")
                    db.add(course2)
                    db.flush()

                en1 = Enrollment(student_id=profile.id, course_id=course1.id)
                en2 = Enrollment(student_id=profile.id, course_id=course2.id)
                db.add_all([en1, en2])
                db.flush()

                db.add_all(
                    [
                        Attendance(enrollment_id=en1.id, status="present"),
                        Attendance(enrollment_id=en1.id, status="absent"),
                        Attendance(enrollment_id=en2.id, status="present"),
                        Grade(enrollment_id=en1.id, exam_name="Mid Term", max_marks=100, marks_obtained=78),
                        Grade(enrollment_id=en2.id, exam_name="Mid Term", max_marks=100, marks_obtained=82),
                        FeeRecord(student_id=profile.id, amount_due=50000, amount_paid=25000, due_date=date(2026, 3, 30), status="pending"),
                        Announcement(title="Welcome to CampusIQ", body="All students can now track attendance and fees online.", audience="all"),
                    ]
                )

        if not db.query(SiteSetting).filter(SiteSetting.key == "site_title").first():
            db.add_all(
                [
                    SiteSetting(key="site_title", value="CampusIQ"),
                    SiteSetting(key="site_subtitle", value="Future-ready campus operations in one dashboard"),
                    SiteSetting(key="hero_cta", value="A modern ERP for attendance, academics, and outcomes."),
                ]
            )

        db.commit()
    finally:
        db.close()


app.include_router(public.router)
app.include_router(admin.router)
app.include_router(student.router)
app.include_router(teacher.router)
app.include_router(search.router)
app.include_router(teacher_api.router)
app.include_router(analytics.router)
app.include_router(expenses.router)
