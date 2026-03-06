from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    roll_no = Column(String(50), unique=True, nullable=False)
    department = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    phone = Column(String(20), default="")
    guardian_name = Column(String(120), default="")
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=True)

    user = relationship("User", back_populates="student_profile")
    branch = relationship("Branch")
    semester = relationship("Semester")
    fees = relationship("FeeRecord", back_populates="student")
    interventions = relationship("Intervention", back_populates="student")
    extra_details = relationship("StudentExtraDetail", back_populates="student", uselist=False)


class StudentExtraDetail(Base):
    __tablename__ = "student_extra_details"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), unique=True, nullable=False, index=True)
    father_name = Column(String(120), default="")
    mother_name = Column(String(120), default="")
    current_mobile = Column(String(20), default="")
    alternate_mobile = Column(String(20), default="")
    address = Column(String(255), default="")
    blood_group = Column(String(10), default="")

    student = relationship("StudentProfile", back_populates="extra_details")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    title = Column(String(120), nullable=False)
    credits = Column(Integer, nullable=False)
    semester = Column(String(30), nullable=False)

    enrollments = relationship("Enrollment", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_student_course"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")
    course = relationship("Course", back_populates="enrollments")
    attendance = relationship("Attendance", back_populates="enrollment")
    grades = relationship("Grade", back_populates="enrollment")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    date = Column(Date, default=date.today)
    status = Column(String(10), nullable=False)

    enrollment = relationship("Enrollment", back_populates="attendance")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    exam_name = Column(String(80), nullable=False)
    max_marks = Column(Float, nullable=False)
    marks_obtained = Column(Float, nullable=False)

    enrollment = relationship("Enrollment", back_populates="grades")


class FeeRecord(Base):
    __tablename__ = "fee_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False, default=0.0)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile", back_populates="fees")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(160), nullable=False)
    body = Column(Text, nullable=False)
    audience = Column(String(30), nullable=False, default="all")
    created_at = Column(DateTime, default=datetime.utcnow)


class SiteSetting(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True)
    key = Column(String(80), unique=True, nullable=False)
    value = Column(String(255), nullable=False)


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    recommendation = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(String(5), default="no")

    student = relationship("StudentProfile", back_populates="interventions")


class LoginOTP(Base):
    __tablename__ = "login_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    consumed_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0)
    email_sent = Column(String(5), default="no")
    sms_sent = Column(String(5), default="no")

    user = relationship("User")


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    channel = Column(String(10), nullable=False, default="email")
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    consumed_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0)

    user = relationship("User")


class KnownDevice(Base):
    __tablename__ = "known_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    device_hash = Column(String(120), nullable=False, index=True)
    device_name = Column(String(255), default="")
    approved = Column(String(5), default="yes")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class DeviceApprovalToken(Base):
    __tablename__ = "device_approval_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    device_hash = Column(String(120), nullable=False, index=True)
    device_name = Column(String(255), default="")
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    consumed_at = Column(DateTime, nullable=True)

    user = relationship("User")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(120), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    semesters = relationship("Semester", back_populates="branch")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_year = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch", back_populates="semesters")


class Circular(Base):
    __tablename__ = "circulars"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=True)
    target_branch = Column(String(50), nullable=True)  # NULL or branch name or "ALL"
    target_semester = Column(Integer, nullable=True)  # NULL or semester number or 0 for ALL
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch")
    semester = relationship("Semester")


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    subject_name = Column(String(120), nullable=False)
    exam_date = Column(Date, nullable=False)
    exam_time = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch")
    semester = relationship("Semester")


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    subject_name = Column(String(120), nullable=False)
    max_marks = Column(Float, nullable=False)
    marks_obtained = Column(Float, nullable=False)
    exam_name = Column(String(80), nullable=False)
    status = Column(String(20), nullable=False, default="draft")  # draft, coming_soon, published
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch")
    semester = relationship("Semester")
    student = relationship("StudentProfile")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String(20), nullable=False, default="all")  # all, teacher, student
    target_branch_id = Column(Integer, nullable=True)  # NULL or branch_id or 0 for ALL
    target_semester_id = Column(Integer, nullable=True)  # NULL or semester_id or 0 for ALL
    created_by = Column(Integer, nullable=True)
    is_published = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    target_branch = Column(String(50), nullable=True)  # NULL or branch name or "ALL"
    target_semester = Column(Integer, nullable=True)  # NULL or semester number or 0 for ALL
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    phone = Column(String(20), default="")
    qualification = Column(String(120), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    branch = relationship("Branch")
    semester = relationship("Semester")


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(100), nullable=False)
    bus_number = Column(String(50), nullable=False)
    departure_time = Column(String(50))
    stops = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class StudentTransport(Base):
    __tablename__ = "student_transport"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    route_id = Column(Integer, ForeignKey("transport_routes.id"))
    pickup_stop = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")
    route = relationship("TransportRoute")


class HostelRoom(Base):
    __tablename__ = "hostel_rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(20), nullable=False)
    floor = Column(Integer)
    capacity = Column(Integer, default=4)
    current_occupancy = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class StudentHostel(Base):
    __tablename__ = "student_hostel"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    room_id = Column(Integer, ForeignKey("hostel_rooms.id"))
    bed_number = Column(String(10))
    join_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")
    room = relationship("HostelRoom")


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


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    message = Column(Text, nullable=False)
    link = Column(String(200))
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")


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


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


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
