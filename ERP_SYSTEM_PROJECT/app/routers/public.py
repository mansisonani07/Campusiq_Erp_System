from datetime import datetime
import logging
import os
from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..models import User, SiteSetting, StudentProfile, LoginOTP, PasswordResetOTP, KnownDevice, DeviceApprovalToken
from ..auth import verify_password, hash_password
from ..auth_flow import (
    role_matches_login_category,
    normalize_login_role,
    normalize_phone,
    valid_email,
    valid_phone,
    valid_strong_password,
    resolve_user_phone,
    find_user_by_identifier,
    email_exists_for_other_user,
    phone_exists_for_other_student,
    send_login_otp,
    parse_pending_login_meta,
    ensure_device_approved_or_send_request,
    get_client_ip,
    get_device_name,
    emit_dev_otp,
)
from ..permissions import has_permission
from ..services import dashboard_metrics, attendance_percentage, grade_average
from .dashboard import (
    homepage_alerts,
    enrollment_trend_last_12_months,
    today_snapshot,
    recent_activity_feed,
)
from ..session import (
    set_user_session,
    clear_user_session,
    set_pending_login_session,
    get_pending_login_session,
    clear_pending_login_session,
    set_pending_reset_session,
    get_pending_reset_session,
    clear_pending_reset_session,
)
from ..otp import generate_otp, hash_otp, otp_expiry, verify_otp
from ..notifications import (
    send_otp_email,
    send_otp_sms,
    send_alert_email,
    send_alert_sms,
    mask_email,
    mask_phone,
)
from ..form_parser import get_form_value

router = APIRouter()
otp_logger = logging.getLogger("uvicorn.error")

REGISTER_ROLE_OPTIONS = [
    ("student", "Student"),
    ("teacher", "Teacher"),
    ("accountant", "Accountant"),
    ("counselor", "Counselor"),
    ("admin", "Admin"),
]
REGISTER_ROLE_VALUES = {value for value, _ in REGISTER_ROLE_OPTIONS}
REGISTER_BRANCH_OPTIONS = [
    "Computer Engineering",
    "BCA",
    "MCA",
    "IT Engineering",
    "CSE",
]
REGISTER_DEPARTMENT_OPTIONS = [
    "BTech",
    "BE",
    "BCom",
]


def sms_console_mode() -> bool:
    return os.getenv("SMS_PROVIDER", "console").strip().lower() == "console"


def debug_otp_console_enabled() -> bool:
    flag = os.getenv("OTP_DEBUG_CONSOLE", "").strip().lower()
    return flag == "" or flag in {"1", "true", "yes", "on"}


def set_default_settings(db: Session):
    defaults = {
        "site_title": "CampusIQ",
        "site_subtitle": "Future-ready campus operations in one dashboard",
        "hero_cta": "Streamline academics, attendance, fees, and communication.",
    }
    changed = False
    for key, value in defaults.items():
        if not db.query(SiteSetting).filter_by(key=key).first():
            db.add(SiteSetting(key=key, value=value))
            changed = True
    if changed:
        db.commit()


def login_context(
    request: Request,
    *,
    error: str | None = None,
    message: str | None = None,
    selected_role: str = "student",
    identifier_type: str = "email",
    identifier_value: str = "",
    remember_checked: bool = False,
):
    return {
        "request": request,
        "error": error,
        "selected_role": selected_role,
        "identifier_type": identifier_type,
        "identifier_value": identifier_value,
        "remember_checked": remember_checked,
        "message": message,
        "title": "Login - CampusIQ",
    }


def register_context(
    request: Request,
    *,
    error: str | None = None,
    message: str | None = None,
    form_data: dict | None = None,
):
    data = {
        "role": "student",
        "name": "",
        "email": "",
        "phone": "",
        "roll_no": "",
        "branch": "",
        "department": "",
        "year": "1",
        "guardian_name": "",
    }
    if form_data:
        data.update(form_data)
    return {
        "request": request,
        "error": error,
        "message": message,
        "form_data": data,
        "role_options": REGISTER_ROLE_OPTIONS,
        "branch_options": REGISTER_BRANCH_OPTIONS,
        "department_options": REGISTER_DEPARTMENT_OPTIONS,
        "title": "Create Account - CampusIQ",
    }


@router.get("/")
def home(request: Request, db: Session = Depends(get_db)):
    set_default_settings(db)
    settings = {s.key: s.value for s in db.query(SiteSetting).all()}
    return request.app.state.templates.TemplateResponse(
        "index.html",
        {"request": request, "settings": settings, "title": settings.get("site_title", "CampusIQ")},
    )


@router.get("/competencies")
def competencies(request: Request):
    return request.app.state.templates.TemplateResponse(
        "competencies.html",
        {"request": request, "title": "Competencies - CampusIQ"},
    )


@router.get("/open-portal")
def open_portal(request: Request):
    # Clear any existing session to ensure fresh login
    request.session.clear()
    request.session["portal_entry"] = "nova_home"
    request.session["portal_notice"] = "Secure session started. Please login to continue."
    return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/login")
def login_page(request: Request):
    user_id = request.session.get("user_id")
    role = (request.session.get("role") or "").strip().lower()
    portal_notice = request.session.pop("portal_notice", None)
    msg = request.query_params.get("msg") or portal_notice
    if user_id and role:
        session_msg = f"Current session: {role.upper()}. You can login with another account below."
        msg = f"{msg} {session_msg}".strip() if msg else session_msg
    return request.app.state.templates.TemplateResponse(
        "login.html",
        login_context(request, message=msg),
    )


@router.post("/login")
def login(
    request: Request,
    db: Session = Depends(get_db),
):
    # Use pre-parsed form data from middleware
    login_as = get_form_value(request, "login_as")
    identifier_type = get_form_value(request, "identifier_type")
    identifier = get_form_value(request, "identifier")
    password = get_form_value(request, "password")
    remember_me = get_form_value(request, "remember_me")
    clear_pending_login_session(request)
    normalized_role = normalize_login_role(login_as)
    id_type = identifier_type.strip().lower()
    normalized_identifier = identifier.strip()

    if normalized_role not in {"student", "teacher", "admin"}:
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(request, error="Please choose a valid login role.", selected_role="student", identifier_type="email"),
            status_code=400,
        )
    if id_type not in {"email", "phone"}:
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error="Please choose Email or Phone login.",
                selected_role=normalized_role,
                identifier_type="email",
                identifier_value=normalized_identifier,
            ),
            status_code=400,
        )
    if id_type == "email" and not valid_email(normalized_identifier.lower()):
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error="Enter a valid email address.",
                selected_role=normalized_role,
                identifier_type=id_type,
                identifier_value=normalized_identifier,
            ),
            status_code=400,
        )
    if id_type == "phone" and not valid_phone(normalized_identifier):
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error="Enter a valid phone number.",
                selected_role=normalized_role,
                identifier_type=id_type,
                identifier_value=normalized_identifier,
            ),
            status_code=400,
        )

    user = find_user_by_identifier(db, id_type, normalized_identifier)
    if not user or not verify_password(password, user.password_hash):
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error="Invalid credentials.",
                selected_role=normalized_role,
                identifier_type=id_type,
                identifier_value=normalized_identifier,
            ),
            status_code=400,
        )
    if not role_matches_login_category(user.role, normalized_role):
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error="Selected login role does not match this account.",
                selected_role=normalized_role,
                identifier_type=id_type,
                identifier_value=normalized_identifier,
            ),
            status_code=400,
        )

    device_ok, device_msg = ensure_device_approved_or_send_request(db, request, user)
    if not device_ok:
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error=device_msg,
                selected_role=normalized_role,
                identifier_type=id_type,
                identifier_value=normalized_identifier,
            ),
            status_code=403,
        )

    remember = (remember_me or "").lower() in {"on", "yes", "true", "1"}
    ok, msg, masked_email, masked_phone, dev_otp = send_login_otp(db, user)
    if not ok:
        return request.app.state.templates.TemplateResponse(
            "login.html",
            login_context(
                request,
                error=f"OTP delivery failed. {msg}",
                selected_role=normalized_role,
                identifier_type=id_type,
                identifier_value=normalized_identifier,
                remember_checked=remember,
            ),
            status_code=500,
        )
    # Always print OTP to console for development - no condition needed
    print(f"\n{'='*60}")
    print(f"*** OTP FOR LOGIN ***")
    print(f"User: {user.email} | Role: {normalized_role}")
    print(f">>>>>>> YOUR OTP: {dev_otp} <<<<<<")
    print(f"(Expires in 5 minutes)")
    print(f"{'='*60}\n", flush=True)
    emit_dev_otp(f"[DEV-OTP] Login route confirm | User {user.email} | OTP: {dev_otp}")
    set_pending_login_session(request, user.id, f"{normalized_role}|{'yes' if remember else 'no'}")
    request.session["pending_login_dev_otp"] = dev_otp or ""
    return request.app.state.templates.TemplateResponse(
        "verify_otp.html",
        {
            "request": request,
            "error": None,
            "masked_email": masked_email,
            "masked_phone": masked_phone,
            "otp_notice": msg,
            "sms_dev_mode": sms_console_mode(),
            "dev_otp": dev_otp,
        },
    )


@router.get("/portal-home")
def portal_home(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    role = (request.session.get("role") or "").strip().lower()
    if not user_id or not role:
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
    # Enforce strict role dashboards to avoid mixed architecture confusion.
    if role in {"admin", "accountant", "counselor"}:
        return RedirectResponse("/admin/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    if role == "teacher":
        return RedirectResponse("/teacher/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    if role == "student":
        return RedirectResponse("/student/dashboard", status_code=status.HTTP_303_SEE_OTHER)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return RedirectResponse("/logout", status_code=status.HTTP_303_SEE_OTHER)

    summary: list[dict] = []
    announcements: list = []
    modules: list[dict] = []
    alerts: list[dict] = []
    trend: list[dict] = []
    snapshot: dict | None = None
    activity: list[dict] = []
    present_today = 0
    absent_today = 0
    academic_year = ""
    semester = ""
    if role in {"admin", "accountant", "counselor"}:
        kpis = dashboard_metrics(db)
        academic_year = kpis.get("academic_year", "")
        semester = kpis.get("semester", "")
        summary = [
            {"label": "Students", "value": kpis["students"]},
            {"label": "Courses", "value": kpis["courses"]},
            {"label": "Pending Fees (₹)", "value": f"₹{kpis['pending_amount']:,.0f}"},
            {
                "label": "Collection",
                "value": f"{kpis['collection_rate']}%",
                "detail": f"₹{kpis['total_paid']:,.0f} / ₹{kpis['total_due']:,.0f}",
                "rate": kpis["collection_rate"],
            },
        ]
        announcements = (
            db.query(models.Announcement)
            .filter(models.Announcement.audience.in_(["all", "staff"]))
            .order_by(models.Announcement.created_at.desc())
            .limit(5)
            .all()
        )
        alerts = homepage_alerts(db)
        trend = enrollment_trend_last_12_months(db)
        snapshot = today_snapshot(db)
        activity = recent_activity_feed(db)
        present_today = kpis.get("present_today", 0)
        absent_today = kpis.get("absent_today", 0)
        admin_modules = [
            ("Overview", "/admin/dashboard", "dashboard.view", "Live KPIs, trends, and action center.", "View Dashboard"),
            ("Student Records", "/admin/students", "students.view", "Profiles, contact data, and academic status.", "View Students"),
            ("Courses", "/admin/courses", "courses.view", "Course catalog, credits, and semester mapping.", "Manage Courses"),
            ("Registrations", "/admin/enrollments", "enrollments.view", "Enrollment lifecycle and allocations.", "Manage Enrollments"),
            ("Attendance", "/admin/attendance", "attendance.view", "Daily attendance and compliance checks.", "Take Attendance"),
            ("Assessments", "/admin/grades", "grades.view", "Exam scores, averages, and learning outcomes.", "Record Grades"),
            ("Billing", "/admin/fees", "fees.view", "Fee collection, reminders, and dues tracking.", "Collect Fees"),
            ("Notices", "/admin/announcements", "announcements.view", "Targeted announcements and updates.", "Publish Notice"),
            ("Counseling", "/admin/interventions", "interventions.view", "Risk interventions and support tracking.", "View Risk Cases"),
            ("Institute Settings", "/admin/settings", "settings.manage", "Portal branding and operational setup.", "Open Settings"),
            ("Access Control", "/admin/users", "users.manage", "Role assignments and account permissions.", "Manage Access"),
        ]
        for title, href, perm, subtitle, cta in admin_modules:
            if has_permission(role, perm):
                modules.append({"title": title, "href": href, "subtitle": subtitle, "cta": cta})
        placeholder_modules = [
            ("Library", "Catalog, issue, and returns."),
            ("Transport", "Bus routes, GPS, and pickup alerts."),
            ("Hostel", "Room allocation and fee tracking."),
            ("Timetable", "Schedule builder and exam slots."),
            ("Alumni", "Alumni profiles and engagement."),
            ("HR & Payroll", "Staff records and salary slips."),
        ]
        for title, subtitle in placeholder_modules:
            modules.append({"title": title, "href": "#", "subtitle": subtitle, "cta": "Coming Soon", "disabled": True})
    elif role == "teacher":
        # Teacher sees only their modules
        kpis = dashboard_metrics(db)
        academic_year = kpis.get("academic_year", "")
        semester = kpis.get("semester", "")
        announcements = (
            db.query(models.Announcement)
            .filter(models.Announcement.audience.in_(["all", "staff"]))
            .order_by(models.Announcement.created_at.desc())
            .limit(5)
            .all()
        )
        modules = [
            {"title": "My Students", "href": "/teacher/students", "subtitle": "View your assigned class students.", "cta": "View Students"},
            {"title": "Attendance", "href": "/teacher/attendance", "subtitle": "Mark daily attendance for your class.", "cta": "Take Attendance"},
            {"title": "Marks Entry", "href": "/teacher/grades", "subtitle": "Enter marks for your subject.", "cta": "Enter Marks"},
            {"title": "Leave Applications", "href": "/teacher/leave-applications", "subtitle": "Review student leave requests.", "cta": "View Leaves"},
            {"title": "Study Materials", "href": "/teacher/study-materials", "subtitle": "Upload materials for your class.", "cta": "Upload Material"},
            {"title": "Notices", "href": "/teacher/notices", "subtitle": "View notices for teachers.", "cta": "View Notices"},
            {"title": "Circulars", "href": "/teacher/circulars", "subtitle": "View circulars for your branch.", "cta": "View Circulars"},
            {"title": "Exam Schedule", "href": "/teacher/exam-schedule", "subtitle": "View exam schedule for your class.", "cta": "View Schedule"},
        ]
        return request.app.state.templates.TemplateResponse(
            "portal_home.html",
            {
                "request": request,
                "user": user,
                "role": role,
                "summary": [],
                "modules": modules,
                "announcements": announcements,
                "alerts": [],
                "trend": [],
                "present_today": 0,
                "absent_today": 0,
                "snapshot": None,
                "activity": [],
                "academic_year": academic_year,
                "semester": semester,
                "title": "Teacher Portal - CampusIQ",
            },
        )
    else:
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
        if profile:
            summary = [
                {"label": "Attendance", "value": f"{attendance_percentage(db, profile.id)}%"},
                {"label": "Average Marks", "value": f"{grade_average(db, profile.id)}%"},
                {
                    "label": "Pending Fees",
                    "value": db.query(models.FeeRecord)
                    .filter(models.FeeRecord.student_id == profile.id, models.FeeRecord.status != "paid")
                    .count(),
                },
                {"label": "Department", "value": profile.department},
            ]
        announcements = (
            db.query(models.Announcement)
            .filter(models.Announcement.audience.in_(["all", "students"]))
            .order_by(models.Announcement.created_at.desc())
            .limit(5)
            .all()
        )
        modules = [
            {"title": "Student Dashboard", "href": "/student/dashboard", "subtitle": "Attendance, grades, fees, and notices.", "cta": "View Dashboard"},
            {"title": "Update Contact", "href": "/update-contact", "subtitle": "Update email or phone for account recovery.", "cta": "Update Details"},
            {"title": "Reset Password", "href": "/forgot-password", "subtitle": "Secure account recovery and password reset.", "cta": "Reset Password"},
        ]

    return request.app.state.templates.TemplateResponse(
        "portal_home.html",
        {
            "request": request,
            "user": user,
            "role": role,
            "summary": summary,
            "modules": modules,
            "announcements": announcements,
            "alerts": alerts,
            "trend": trend,
            "present_today": present_today,
            "absent_today": absent_today,
            "snapshot": snapshot,
            "activity": activity,
            "academic_year": academic_year,
            "semester": semester,
            "title": "Portal Home - CampusIQ",
        },
    )


@router.get("/verify-otp")
def verify_otp_page(request: Request, db: Session = Depends(get_db)):
    pending_user_id, pending_meta = get_pending_login_session(request.session)
    if not pending_user_id:
        clear_pending_login_session(request)
        request.session.pop("pending_login_dev_otp", None)
        return request.app.state.templates.TemplateResponse(
            "verify_otp.html",
            {
                "request": request,
                "error": "OTP session not found or expired. Please login again.",
                "masked_email": "hidden",
                "masked_phone": "hidden",
                "otp_notice": None,
                "sms_dev_mode": sms_console_mode(),
                "dev_otp": "",
            },
            status_code=400,
        )
    user = db.query(User).filter(User.id == pending_user_id).first()
    if not user:
        clear_pending_login_session(request)
        request.session.pop("pending_login_dev_otp", None)
        return request.app.state.templates.TemplateResponse(
            "verify_otp.html",
            {
                "request": request,
                "error": "OTP session expired. Please login again.",
                "masked_email": "hidden",
                "masked_phone": "hidden",
                "otp_notice": None,
                "sms_dev_mode": sms_console_mode(),
                "dev_otp": "",
            },
            status_code=400,
        )
    phone = resolve_user_phone(db, user) or ""
    pending_dev_otp = request.session.get("pending_login_dev_otp", "")
    if pending_dev_otp and debug_otp_console_enabled():
        message = f"[DEV-OTP] User {user.email} | OTP: {pending_dev_otp}"
        emit_dev_otp(message)
    return request.app.state.templates.TemplateResponse(
        "verify_otp.html",
        {
            "request": request,
            "error": None,
            "masked_email": mask_email(user.email),
            "masked_phone": mask_phone(phone),
            "otp_notice": "Enter OTP sent to both your email and phone.",
            "sms_dev_mode": sms_console_mode(),
            "dev_otp": pending_dev_otp,
        },
    )


@router.post("/resend-otp")
def resend_otp(request: Request, db: Session = Depends(get_db)):
    pending_user_id, pending_meta = get_pending_login_session(request.session)
    if not pending_user_id:
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
    user = db.query(User).filter(User.id == pending_user_id).first()
    if not user:
        clear_pending_login_session(request)
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

    ok, msg, masked_email, masked_phone, dev_otp = send_login_otp(db, user)
    request.session["pending_login_dev_otp"] = dev_otp or ""
    if dev_otp and debug_otp_console_enabled():
        emit_dev_otp(f"[DEV-OTP] Resend route confirm | User {user.email} | OTP: {dev_otp}")
    if not ok:
        phone = resolve_user_phone(db, user) or ""
        return request.app.state.templates.TemplateResponse(
            "verify_otp.html",
            {
                "request": request,
                "error": f"OTP resend failed. {msg}",
                "masked_email": mask_email(user.email),
                "masked_phone": mask_phone(phone),
                "otp_notice": None,
                "sms_dev_mode": sms_console_mode(),
                "dev_otp": dev_otp,
            },
            status_code=500,
        )

    return request.app.state.templates.TemplateResponse(
        "verify_otp.html",
        {
            "request": request,
            "error": None,
            "masked_email": masked_email,
            "masked_phone": masked_phone,
            "otp_notice": f"New OTP sent to both email and phone. {msg}",
            "sms_dev_mode": sms_console_mode(),
            "dev_otp": dev_otp,
        },
    )


@router.post("/verify-otp")
def verify_otp_submit(request: Request, db: Session = Depends(get_db)):
    # Use pre-parsed form data from middleware
    otp_code = get_form_value(request, "otp_code")
    pending_user_id, pending_meta = get_pending_login_session(request.session)
    if not pending_user_id:
        request.session.pop("pending_login_dev_otp", None)
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

    user = db.query(User).filter(User.id == pending_user_id).first()
    if not user:
        clear_pending_login_session(request)
        request.session.pop("pending_login_dev_otp", None)
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

    row = (
        db.query(LoginOTP)
        .filter(LoginOTP.user_id == user.id, LoginOTP.consumed_at.is_(None))
        .order_by(LoginOTP.created_at.desc())
        .first()
    )
    if not row or row.expires_at < datetime.utcnow():
        clear_pending_login_session(request)
        request.session.pop("pending_login_dev_otp", None)
        return RedirectResponse("/login?msg=OTP expired, login again", status_code=status.HTTP_303_SEE_OTHER)

    row.attempt_count += 1
    if row.attempt_count > 5:
        row.consumed_at = datetime.utcnow()
        db.commit()
        clear_pending_login_session(request)
        request.session.pop("pending_login_dev_otp", None)
        return RedirectResponse("/login?msg=Too many OTP attempts", status_code=status.HTTP_303_SEE_OTHER)

    if not verify_otp(otp_code.strip(), row.otp_hash):
        db.commit()
        phone = resolve_user_phone(db, user) or ""
        return request.app.state.templates.TemplateResponse(
            "verify_otp.html",
            {
                "request": request,
                "error": "Invalid OTP. Try again.",
                "masked_email": mask_email(user.email),
                "masked_phone": mask_phone(phone),
                "sms_dev_mode": sms_console_mode(),
            },
            status_code=400,
        )

    row.consumed_at = datetime.utcnow()
    db.commit()
    clear_pending_login_session(request)
    request.session.pop("pending_login_dev_otp", None)
    selected_role, remember = parse_pending_login_meta(pending_meta)
    normalized_role = normalize_login_role(selected_role)
    if not role_matches_login_category(user.role, normalized_role):
        return RedirectResponse("/login?msg=Selected login role does not match this account.", status_code=status.HTTP_303_SEE_OTHER)
    set_user_session(request, user.id, user.role, remember_me=remember)
    request.session.pop("portal_entry", None)
    request.session.pop("portal_notice", None)
    
    # Load branch_id and semester_id into session for students and teachers
    if normalized_role == "teacher":
        teacher_profile = db.query(models.TeacherProfile).filter(
            models.TeacherProfile.user_id == user.id
        ).first()
        if teacher_profile:
            request.session["branch_id"] = teacher_profile.branch_id
            request.session["semester_id"] = teacher_profile.semester_id
    elif normalized_role == "student":
        student_profile = db.query(models.StudentProfile).filter(
            models.StudentProfile.user_id == user.id
        ).first()
        if student_profile:
            request.session["branch_id"] = student_profile.branch_id
            request.session["semester_id"] = student_profile.semester_id
            request.session["student_profile_id"] = student_profile.id
    
    login_subject = "Login Alert - CampusIQ"
    login_body = (
        f"You logged in successfully.\n"
        f"Time: {datetime.utcnow().isoformat()} UTC\n"
        f"Device: {get_device_name(request)}\n"
        f"IP: {get_client_ip(request)}"
    )
    send_alert_email(user.email, login_subject, login_body)
    phone = resolve_user_phone(db, user)
    if phone:
        send_alert_sms(phone, "Login successful on your ERP account.")
    
    # Redirect based on role to correct dashboard
    if normalized_role == "teacher":
        return RedirectResponse("/teacher/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    if normalized_role in {"admin", "accountant", "counselor"}:
        return RedirectResponse("/admin/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    if normalized_role == "student":
        return RedirectResponse("/student/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    return RedirectResponse("/portal-home", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/approve-device")
def approve_device(request: Request, token: str, db: Session = Depends(get_db)):
    token_h = hash_otp(token.strip())
    row = (
        db.query(DeviceApprovalToken)
        .filter(DeviceApprovalToken.token_hash == token_h, DeviceApprovalToken.consumed_at.is_(None))
        .order_by(DeviceApprovalToken.created_at.desc())
        .first()
    )
    if not row or row.expires_at < datetime.utcnow():
        return RedirectResponse("/login?msg=Device approval link expired. Try login again.", status_code=status.HTTP_303_SEE_OTHER)

    known = db.query(KnownDevice).filter(KnownDevice.user_id == row.user_id, KnownDevice.device_hash == row.device_hash).first()
    if known:
        known.approved = "yes"
        known.last_seen_at = datetime.utcnow()
        known.device_name = row.device_name
    else:
        db.add(
            KnownDevice(
                user_id=row.user_id,
                device_hash=row.device_hash,
                device_name=row.device_name,
                approved="yes",
                last_seen_at=datetime.utcnow(),
            )
        )
    row.consumed_at = datetime.utcnow()
    db.commit()
    return RedirectResponse("/login?msg=Device approved. You can now login.", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/register")
def register_page(request: Request):
    msg = request.query_params.get("msg")
    return request.app.state.templates.TemplateResponse("register.html", register_context(request, message=msg))


@router.get("/auth/google/start")
def auth_google_start(request: Request, mode: str = "login"):
    normalized_mode = mode.strip().lower()
    if normalized_mode not in {"login", "register"}:
        normalized_mode = "login"
    message = "Google sign in is not configured yet. Add Google OAuth credentials to enable this option."
    target = "/register" if normalized_mode == "register" else "/login"
    return RedirectResponse(f"{target}?msg={message}", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/register")
def register_submit(
    request: Request,
    db: Session = Depends(get_db),
):
    # Use pre-parsed form data from middleware
    name = get_form_value(request, "name")
    email = get_form_value(request, "email")
    role = get_form_value(request, "role", "student")
    phone = get_form_value(request, "phone")
    password = get_form_value(request, "password")
    confirm_password = get_form_value(request, "confirm_password")
    roll_no = get_form_value(request, "roll_no")
    branch = get_form_value(request, "branch")
    department = get_form_value(request, "department")
    year_str = get_form_value(request, "year", "1")
    year = int(year_str) if year_str.isdigit() else 1
    guardian_name = get_form_value(request, "guardian_name")
    normalized_role = role.strip().lower()
    normalized_email = email.strip().lower()
    normalized_phone = normalize_phone(phone.strip())
    normalized_name = name.strip()
    normalized_roll_no = roll_no.strip()
    normalized_branch = branch.strip()
    normalized_department = department.strip()
    normalized_guardian = guardian_name.strip()
    form_data = {
        "role": normalized_role or "student",
        "name": normalized_name,
        "email": normalized_email,
        "phone": normalized_phone,
        "roll_no": normalized_roll_no,
        "branch": normalized_branch,
        "department": normalized_department,
        "year": str(year),
        "guardian_name": normalized_guardian,
    }

    if normalized_role not in REGISTER_ROLE_VALUES:
        return request.app.state.templates.TemplateResponse(
            "register.html",
            register_context(request, error="Please choose a valid role.", form_data=form_data),
            status_code=400,
        )
    if len(normalized_name) < 2:
        return request.app.state.templates.TemplateResponse(
            "register.html", register_context(request, error="Name must be at least 2 characters.", form_data=form_data), status_code=400
        )
    if not valid_email(normalized_email):
        return request.app.state.templates.TemplateResponse(
            "register.html", register_context(request, error="Enter a valid email address.", form_data=form_data), status_code=400
        )
    if password != confirm_password:
        return request.app.state.templates.TemplateResponse(
            "register.html", register_context(request, error="Password and Confirm Password must match.", form_data=form_data), status_code=400
        )
    if not valid_strong_password(password):
        return request.app.state.templates.TemplateResponse(
            "register.html",
            register_context(
                request,
                error="Password must be 8+ chars and include upper, lower, number, and special character.",
                form_data=form_data,
            ),
            status_code=400,
        )
    if normalized_role == "student":
        if not valid_phone(normalized_phone):
            return request.app.state.templates.TemplateResponse(
                "register.html",
                register_context(request, error="Enter a valid phone number (10-15 digits).", form_data=form_data),
                status_code=400,
            )
        if len(normalized_roll_no) < 3:
            return request.app.state.templates.TemplateResponse(
                "register.html",
                register_context(request, error="Roll number must be at least 3 characters.", form_data=form_data),
                status_code=400,
            )
        if normalized_branch not in REGISTER_BRANCH_OPTIONS:
            return request.app.state.templates.TemplateResponse(
                "register.html",
                register_context(request, error="Please choose a valid branch.", form_data=form_data),
                status_code=400,
            )
        if normalized_department not in REGISTER_DEPARTMENT_OPTIONS:
            return request.app.state.templates.TemplateResponse(
                "register.html",
                register_context(request, error="Please choose a valid department.", form_data=form_data),
                status_code=400,
            )
        if year < 1 or year > 6:
            return request.app.state.templates.TemplateResponse(
                "register.html",
                register_context(request, error="Year must be between 1 and 6.", form_data=form_data),
                status_code=400,
            )
        if phone_exists_for_other_student(db, normalized_phone, 0):
            return request.app.state.templates.TemplateResponse(
                "register.html",
                register_context(request, error="Phone already exists.", form_data=form_data),
                status_code=400,
            )

    user = User(name=normalized_name, email=normalized_email, password_hash=hash_password(password), role=normalized_role)
    db.add(user)
    try:
        db.flush()
        if normalized_role == "student":
            db.add(
                StudentProfile(
                    user_id=user.id,
                    roll_no=normalized_roll_no,
                    department=f"{normalized_department} - {normalized_branch}",
                    year=year,
                    phone=normalized_phone,
                    guardian_name=normalized_guardian,
                )
            )
        db.commit()
    except IntegrityError:
        db.rollback()
        return request.app.state.templates.TemplateResponse(
            "register.html",
            register_context(request, error="Email, Roll No, or Phone already exists.", form_data=form_data),
            status_code=400,
        )
    return RedirectResponse("/login?msg=Account created successfully. Please login.", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/update-contact")
def update_contact_page(request: Request):
    return request.app.state.templates.TemplateResponse(
        "update_contact.html", {"request": request, "error": None, "message": None}
    )


@router.post("/update-contact")
def update_contact_submit(
    request: Request,
    db: Session = Depends(get_db),
):
    # Use pre-parsed form data from middleware
    current_email = get_form_value(request, "current_email")
    password = get_form_value(request, "password")
    new_email = get_form_value(request, "new_email")
    new_phone = get_form_value(request, "new_phone")
    current_email_norm = current_email.strip().lower()
    user = db.query(User).filter(User.email == current_email_norm).first()
    if not user or not verify_password(password, user.password_hash):
        return request.app.state.templates.TemplateResponse(
            "update_contact.html",
            {"request": request, "error": "Current email or password is invalid.", "message": None},
            status_code=400,
        )

    target_email = new_email.strip().lower()
    target_phone = normalize_phone(new_phone.strip())
    if not target_email and not target_phone:
        return request.app.state.templates.TemplateResponse(
            "update_contact.html",
            {"request": request, "error": "Enter new email or new phone to update.", "message": None},
            status_code=400,
        )

    if target_email and email_exists_for_other_user(db, target_email, user.id):
        return request.app.state.templates.TemplateResponse(
            "update_contact.html",
            {"request": request, "error": "New email is already used by another account.", "message": None},
            status_code=400,
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if target_phone:
        if not profile:
            return request.app.state.templates.TemplateResponse(
                "update_contact.html",
                {"request": request, "error": "Phone update is currently supported for student accounts only.", "message": None},
                status_code=400,
            )
        if phone_exists_for_other_student(db, target_phone, user.id):
            return request.app.state.templates.TemplateResponse(
                "update_contact.html",
                {"request": request, "error": "New phone is already used by another account.", "message": None},
                status_code=400,
            )

    if target_email:
        user.email = target_email
    if target_phone and profile:
        profile.phone = target_phone

    db.commit()
    return request.app.state.templates.TemplateResponse(
        "update_contact.html",
        {
            "request": request,
            "error": None,
            "message": "Contact details updated successfully. You can login with updated credentials.",
        },
    )


@router.get("/forgot-password")
def forgot_password_page(request: Request):
    return request.app.state.templates.TemplateResponse(
        "forgot_password.html", {"request": request, "error": None, "message": None}
    )


@router.post("/forgot-password")
def forgot_password_start(
    request: Request,
    db: Session = Depends(get_db),
):
    # Use pre-parsed form data from middleware
    identifier_type = get_form_value(request, "identifier_type")
    identifier = get_form_value(request, "identifier")
    id_type = identifier_type.strip().lower()
    user = find_user_by_identifier(db, id_type, identifier.strip())
    if not user:
        return request.app.state.templates.TemplateResponse(
            "forgot_password.html", {"request": request, "error": "Account not found.", "message": None}, status_code=400
        )

    channel = "email" if id_type == "email" else "sms"
    code = generate_otp()
    row = PasswordResetOTP(
        user_id=user.id,
        otp_hash=hash_otp(code),
        channel=channel,
        expires_at=otp_expiry(10),
        consumed_at=None,
        attempt_count=0,
    )
    db.add(row)
    db.commit()

    if channel == "email":
        ok, msg = send_otp_email(user.email, code)
        masked = mask_email(user.email)
    else:
        phone = resolve_user_phone(db, user)
        if not phone:
            return request.app.state.templates.TemplateResponse(
                "forgot_password.html",
                {"request": request, "error": "Phone number is not configured.", "message": None},
                status_code=400,
            )
        ok, msg = send_otp_sms(phone, code)
        masked = mask_phone(phone)

    if not ok:
        return request.app.state.templates.TemplateResponse(
            "forgot_password.html", {"request": request, "error": f"OTP delivery failed. {msg}", "message": None}, status_code=500
        )

    set_pending_reset_session(request, user.id, channel)
    return request.app.state.templates.TemplateResponse(
        "reset_password.html",
        {"request": request, "error": None, "message": f"OTP sent to {masked}. Enter OTP and set new password."},
    )


@router.get("/reset-password")
def reset_password_page(request: Request):
    pending_user_id, _ = get_pending_reset_session(request.session)
    if not pending_user_id:
        return RedirectResponse("/forgot-password", status_code=status.HTTP_303_SEE_OTHER)
    return request.app.state.templates.TemplateResponse(
        "reset_password.html",
        {"request": request, "error": None, "message": "Enter OTP and set a new password."},
    )


@router.post("/reset-password")
def reset_password_submit(
    request: Request,
    db: Session = Depends(get_db),
):
    # Use pre-parsed form data from middleware
    otp_code = get_form_value(request, "otp_code")
    new_password = get_form_value(request, "new_password")
    confirm_password = get_form_value(request, "confirm_password")
    pending_user_id, channel = get_pending_reset_session(request.session)
    if not pending_user_id or not channel:
        return RedirectResponse("/forgot-password", status_code=status.HTTP_303_SEE_OTHER)
    if new_password != confirm_password:
        return request.app.state.templates.TemplateResponse(
            "reset_password.html", {"request": request, "error": "Passwords do not match.", "message": None}, status_code=400
        )
    if len(new_password) < 8:
        return request.app.state.templates.TemplateResponse(
            "reset_password.html",
            {"request": request, "error": "New password must be at least 8 characters.", "message": None},
            status_code=400,
        )

    row = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == pending_user_id,
            PasswordResetOTP.channel == channel,
            PasswordResetOTP.consumed_at.is_(None),
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    if not row or row.expires_at < datetime.utcnow():
        clear_pending_reset_session(request)
        return RedirectResponse("/forgot-password", status_code=status.HTTP_303_SEE_OTHER)

    row.attempt_count += 1
    if row.attempt_count > 5:
        row.consumed_at = datetime.utcnow()
        db.commit()
        clear_pending_reset_session(request)
        return RedirectResponse("/forgot-password", status_code=status.HTTP_303_SEE_OTHER)

    if not verify_otp(otp_code.strip(), row.otp_hash):
        db.commit()
        return request.app.state.templates.TemplateResponse(
            "reset_password.html", {"request": request, "error": "Invalid OTP.", "message": None}, status_code=400
        )

    user = db.query(User).filter(User.id == pending_user_id).first()
    if not user:
        clear_pending_reset_session(request)
        return RedirectResponse("/forgot-password", status_code=status.HTTP_303_SEE_OTHER)
    user.password_hash = hash_password(new_password)
    row.consumed_at = datetime.utcnow()
    db.commit()
    reset_subject = "Password Changed - CampusIQ"
    reset_body = f"Your password was changed at {datetime.utcnow().isoformat()} UTC."
    send_alert_email(user.email, reset_subject, reset_body)
    phone = resolve_user_phone(db, user)
    if phone:
        send_alert_sms(phone, "Your ERP password was changed.")
    clear_pending_reset_session(request)
    return RedirectResponse("/login?msg=Password updated successfully. Login again.", status_code=status.HTTP_303_SEE_OTHER)


# Simplified Login Routes (Phase 2)
@router.get("/login-simple")
def login_simple_page(request: Request):
    role = (request.session.get("role") or "").strip().lower()
    info = None
    if request.session.get("user_id") and role:
        info = f"Current session: {role.upper()}. You can login again using another account."
    return request.app.state.templates.TemplateResponse(
        "login_simple.html",
        {"request": request, "error": None, "message": info, "title": "Login - CampusIQ"},
    )


@router.post("/login-simple")
def login_simple_submit(request: Request, db: Session = Depends(get_db)):
    email = get_form_value(request, "email")
    password = get_form_value(request, "password")
    
    if not email or not password:
        return request.app.state.templates.TemplateResponse(
            "login_simple.html",
            {"request": request, "error": "Email and password are required.", "title": "Login - CampusIQ"},
            status_code=400,
        )
    
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    
    if not user or not verify_password(password, user.password_hash):
        return request.app.state.templates.TemplateResponse(
            "login_simple.html",
            {"request": request, "error": "Invalid email or password", "title": "Login - CampusIQ"},
            status_code=400,
        )
    
    set_user_session(request, user_id=user.id, role=user.role, remember_me=False, name=user.name)
    
    # Load branch_id and semester_id into session for students and teachers
    if user.role == "teacher":
        teacher_profile = db.query(models.TeacherProfile).filter(
            models.TeacherProfile.user_id == user.id
        ).first()
        if teacher_profile:
            request.session["branch_id"] = teacher_profile.branch_id
            request.session["semester_id"] = teacher_profile.semester_id
    elif user.role == "student":
        student_profile = db.query(models.StudentProfile).filter(
            models.StudentProfile.user_id == user.id
        ).first()
        if student_profile:
            request.session["branch_id"] = student_profile.branch_id
            request.session["semester_id"] = student_profile.semester_id
            request.session["student_profile_id"] = student_profile.id
    
    # Debug: Log the user role for troubleshooting
    print(f"DEBUG: User role is '{user.role}' for user {user.name} (ID: {user.id})")
    
    # Normalize role for comparison (database stores "Teacher", "Student", "Admin", etc.)
    user_role = user.role.lower()
    
    if user_role == "teacher":
        print("DEBUG: Redirecting teacher to /teacher/dashboard")
        return RedirectResponse("/teacher/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    if user_role in {"admin", "accountant", "counselor"}:
        print("DEBUG: Redirecting admin staff to /admin/dashboard")
        return RedirectResponse("/admin/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    if user_role == "student":
        print("DEBUG: Redirecting student to /student/dashboard")
        return RedirectResponse("/student/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    
    print("DEBUG: Redirecting to /portal-home")
    return RedirectResponse("/portal-home", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/logout")
def logout(request: Request):
    request.session.pop("portal_entry", None)
    request.session.pop("portal_notice", None)
    request.session.pop("pending_login_dev_otp", None)
    clear_pending_login_session(request)
    clear_pending_reset_session(request)
    clear_user_session(request)
    return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)
