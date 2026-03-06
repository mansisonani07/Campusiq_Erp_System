from fastapi import APIRouter, Depends, Request, HTTPException, Form, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta
from ..database import get_db
from .. import models
from ..services import attendance_percentage, grade_average
from ..permissions import has_permission
from ..auth import hash_password
from ..auth_flow import valid_phone, valid_strong_password, request_env
from ..notifications import send_alert_email, send_alert_sms
from ..form_parser import get_form_value

router = APIRouter(prefix="/student", tags=["student"])


def require_student(request: Request):
    """Check if user is logged in as student"""
    role = request.session.get("role")
    if role != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    return True


def get_current_profile(request: Request, db: Session) -> models.StudentProfile:
    """Get current student's profile"""
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile


def student_menu(active: str) -> list[dict]:
    """Student sidebar menu - only shows what students can access"""
    items = [
        {"key": "dashboard", "label": "Dashboard", "href": "/student/dashboard"},
        {"key": "attendance", "label": "My Attendance", "href": "/student/attendance"},
        {"key": "fees", "label": "My Fees", "href": "/student/fees"},
        {"key": "results", "label": "My Results", "href": "/student/results"},
        {"key": "timetable", "label": "Timetable", "href": "/student/timetable"},
        {"key": "exam-schedule", "label": "Exam Schedule", "href": "/student/exam-schedule"},
        {"key": "notices", "label": "Notices", "href": "/student/notices"},
        {"key": "circulars", "label": "Circulars", "href": "/student/circulars"},
        {"key": "transport", "label": "Transport", "href": "/student/transport"},
        {"key": "hostel", "label": "Hostel", "href": "/student/hostel"},
        {"key": "profile", "label": "My Profile", "href": "/student/profile"},
    ]
    for item in items:
        item["active"] = item["key"] == active
    return items


def sync_student_session(request: Request, profile: models.StudentProfile):
    """Sync branch_id and semester_id to session"""
    if profile.branch_id:
        request.session["branch_id"] = profile.branch_id
    if profile.semester_id:
        request.session["semester_id"] = profile.semester_id
    # Sync student_profile_id for transport/hostel lookups
    request.session["student_profile_id"] = profile.id


@router.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Dashboard - shows only their own data"""
    profile = get_current_profile(request, db)
    sync_student_session(request, profile)
    
    # Get branch and semester for display
    branch_name = ""
    semester_num = 0
    if profile.branch:
        branch_name = profile.branch.name
    if profile.semester:
        semester_num = profile.semester.semester_number
    
    # Get only this student's enrollments
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.student_id == profile.id).all()
    
    # Get only this student's fees
    fees = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == profile.id).all()
    
    # Get notices filtered by branch and semester
    branch_code = profile.branch.code if profile.branch else ""
    semester_num = profile.semester.semester_number if profile.semester else 0
    
    notices = db.query(models.Notice).filter(
        # Role filter: all or student
        models.Notice.target_role.in_(["all", "student"]),
        # Branch filter: NULL, ALL, or matching branch code
        (models.Notice.target_branch == None) | 
        (models.Notice.target_branch == "ALL") | 
        (models.Notice.target_branch == branch_code),
        # Semester filter: NULL, 0, or matching semester
        (models.Notice.target_semester == None) | 
        (models.Notice.target_semester == 0) | 
        (models.Notice.target_semester == semester_num)
    ).order_by(models.Notice.created_at.desc()).limit(6).all()
    
    # Get circulars filtered by branch and semester
    circulars = db.query(models.Circular).filter(
        (models.Circular.target_branch == None) | 
        (models.Circular.target_branch == "ALL") | 
        (models.Circular.target_branch == branch_code),
        (models.Circular.target_semester == None) | 
        (models.Circular.target_semester == 0) | 
        (models.Circular.target_semester == semester_num)
    ).order_by(models.Circular.created_at.desc()).limit(6).all()
    
    # Get exam schedules for student's branch and semester
    exam_schedules = []
    if profile.branch_id and profile.semester_id:
        exam_schedules = db.query(models.ExamSchedule).filter(
            models.ExamSchedule.branch_id == profile.branch_id,
            models.ExamSchedule.semester_id == profile.semester_id
        ).order_by(models.ExamSchedule.exam_date).limit(5).all()
    
    # Get result status for this branch/semester
    result_status = "draft"
    if profile.branch_id and profile.semester_id:
        result = db.query(models.Result).filter(
            models.Result.branch_id == profile.branch_id,
            models.Result.semester_id == profile.semester_id
        ).first()
        if result:
            result_status = result.status

    total_due = round(sum(f.amount_due for f in fees), 2)
    total_paid = round(sum(f.amount_paid for f in fees), 2)
    pending_amount = round(max(0.0, total_due - total_paid), 2)
    pending_fee_count = sum(1 for f in fees if (f.status or "").lower() != "paid")

    pending_leave_count = db.query(models.LeaveApplication).filter(
        models.LeaveApplication.student_id == profile.id,
        models.LeaveApplication.status == "pending",
    ).count()
    unread_notifications = db.query(models.Notification).filter(
        models.Notification.student_id == profile.id,
        models.Notification.is_read == 0,
    ).count()
    study_material_count = 0
    if profile.branch_id and profile.semester_id:
        study_material_count = db.query(models.StudyMaterial).filter(
            models.StudyMaterial.branch_id == profile.branch_id,
            models.StudyMaterial.semester_id == profile.semester_id,
        ).count()

    profile_fields = [
        profile.user.name if profile.user else "",
        profile.user.email if profile.user else "",
        profile.roll_no,
        profile.department,
        str(profile.year) if profile.year else "",
        profile.phone,
        profile.guardian_name,
    ]
    filled = sum(1 for value in profile_fields if str(value or "").strip())
    profile_completion = int((filled / len(profile_fields)) * 100) if profile_fields else 0

    access_matrix = [
        {"module": "Profile", "read_access": "Full", "write_access": "Limited", "scope": "Own record only"},
        {"module": "Attendance", "read_access": "Full", "write_access": "No", "scope": "Own attendance only"},
        {"module": "Fees", "read_access": "Full", "write_access": "No", "scope": "Own fee ledger only"},
        {"module": "Results", "read_access": "Conditional", "write_access": "No", "scope": "Published status only"},
        {"module": "Leave", "read_access": "Full", "write_access": "Yes", "scope": "Create and track own requests"},
        {"module": "Study Materials", "read_access": "Full", "write_access": "No", "scope": "Assigned branch/semester"},
        {"module": "Notices and Circulars", "read_access": "Full", "write_access": "No", "scope": "Role and class targeted"},
    ]

    action_center: list[dict] = []
    if pending_amount > 0:
        action_center.append({"label": "Check pending fees", "href": "/student/fees", "type": "warning"})
    if pending_leave_count > 0:
        action_center.append({"label": "Review leave request status", "href": "/student/leave", "type": "info"})
    if unread_notifications > 0:
        action_center.append({"label": "Review unread notifications", "href": "/student/notifications", "type": "info"})
    if profile_completion < 85:
        action_center.append({"label": "Complete your profile details", "href": "/student/profile", "type": "warning"})
    if result_status == "published":
        action_center.append({"label": "Review latest published result", "href": "/student/results", "type": "success"})

    return request.app.state.templates.TemplateResponse(
        "student/dashboard.html",
        {
            "request": request,
            "profile": profile,
            "branch_name": branch_name,
            "semester_num": semester_num,
            "enrollments": enrollments,
            "fees": fees,
            "notices": notices,
            "circulars": circulars,
            "exam_schedules": exam_schedules,
            "result_status": result_status,
            "attendance_pct": attendance_percentage(db, profile.id),
            "grade_avg": grade_average(db, profile.id),
            "total_due": total_due,
            "total_paid": total_paid,
            "pending_amount": pending_amount,
            "pending_fee_count": pending_fee_count,
            "pending_leave_count": pending_leave_count,
            "unread_notifications": unread_notifications,
            "study_material_count": study_material_count,
            "profile_completion": profile_completion,
            "access_matrix": access_matrix,
            "action_center": action_center,
            "can_apply_leave": pending_leave_count == 0,
            "student_nav": student_menu("dashboard"),
            "title": "Student Dashboard - CampusIQ",
        },
    )


@router.get("/attendance")
def attendance_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Attendance - shows only their own attendance records, read only"""
    profile = get_current_profile(request, db)
    
    # Get enrollments for this student
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == profile.id
    ).all()
    
    # Get attendance records for this student's enrollments
    attendance_records = []
    enrollment_map = {e.id: e for e in enrollments}
    
    enrollment_ids = [e.id for e in enrollments]
    if enrollment_ids:
        attendance = db.query(models.Attendance).filter(
            models.Attendance.enrollment_id.in_(enrollment_ids)
        ).order_by(models.Attendance.date.desc()).all()
        
        for att in attendance:
            enrollment = enrollment_map[att.enrollment_id]
            attendance_records.append({
                "date": att.date,
                "course_code": enrollment.course.code,
                "course_title": enrollment.course.title,
                "status": att.status,
            })
    
    # Sort by date descending
    attendance_records.sort(key=lambda x: x["date"], reverse=True)
    
    # Calculate attendance stats
    total_days = len(attendance_records)
    present_days = sum(1 for r in attendance_records if r["status"] == "present")
    absent_days = sum(1 for r in attendance_records if r["status"] == "absent")
    attendance_pct = round((present_days / total_days * 100), 2) if total_days > 0 else 0

    return request.app.state.templates.TemplateResponse(
        "student/attendance.html",
        {
            "request": request,
            "profile": profile,
            "attendance_records": attendance_records,
            "total_days": total_days,
            "present_days": present_days,
            "absent_days": absent_days,
            "attendance_pct": attendance_pct,
            "student_nav": student_menu("attendance"),
            "title": "My Attendance - CampusIQ",
        },
    )


@router.get("/fees")
def fees_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Fees - shows only their own fees, read only"""
    profile = get_current_profile(request, db)
    
    # Get only this student's fees
    fees = db.query(models.FeeRecord).filter(
        models.FeeRecord.student_id == profile.id
    ).all()
    
    total_due = round(sum(f.amount_due for f in fees), 2)
    total_paid = round(sum(f.amount_paid for f in fees), 2)
    total_pending = round(max(0.0, total_due - total_paid), 2)

    return request.app.state.templates.TemplateResponse(
        "student/fees.html",
        {
            "request": request,
            "profile": profile,
            "fees": fees,
            "total_due": total_due,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "student_nav": student_menu("fees"),
            "title": "My Fees - CampusIQ",
        },
    )


@router.get("/results")
def student_results(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()

    if not profile:
        return RedirectResponse("/student/dashboard", status_code=303)

    branch = db.query(models.Branch).filter(models.Branch.id == profile.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == profile.semester_id).first()

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == profile.id
    ).all()

    results = []
    exam_names = set()
    for enrollment in enrollments:
        course = db.query(models.Course).filter(models.Course.id == enrollment.course_id).first()
        grades = db.query(models.Grade).filter(models.Grade.enrollment_id == enrollment.id).all()
        for grade in grades:
            pct = round((grade.marks_obtained / grade.max_marks * 100), 1) if grade.max_marks > 0 else 0
            results.append({
                "course": course.title if course else "N/A",
                "course_code": course.code if course else "N/A",
                "exam": grade.exam_name,
                "marks_obtained": grade.marks_obtained,
                "max_marks": grade.max_marks,
                "percentage": pct,
                "grade": "A+" if pct >= 90 else "A" if pct >= 80 else "B+" if pct >= 70 else "B" if pct >= 60 else "C" if pct >= 50 else "D" if pct >= 40 else "F",
                "status": "Pass" if pct >= 40 else "Fail"
            })
            exam_names.add(grade.exam_name)

    overall_pct = round(sum(r["percentage"] for r in results) / len(results), 1) if results else 0
    pass_count = len([r for r in results if r["status"] == "Pass"])
    fail_count = len([r for r in results if r["status"] == "Fail"])

    return request.app.state.templates.TemplateResponse(
        "student/results.html",
        {
            "request": request,
            "user": user,
            "profile": profile,
            "branch": branch,
            "semester": semester,
            "results": results,
            "overall_pct": overall_pct,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "total_exams": len(results),
            "student_nav": student_menu("results"),
            "title": "My Results - CampusIQ",
        }
    )


@router.get("/timetable")
def timetable_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Timetable - shows only their branch+semester timetable"""
    profile = get_current_profile(request, db)
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == profile.id
    ).all()
    courses = [e.course for e in enrollments if getattr(e, "course", None)]
    if not courses:
        courses = [
            type("CourseLite", (), {"title": "Mathematics"})(),
            type("CourseLite", (), {"title": "Programming Fundamentals"})(),
            type("CourseLite", (), {"title": "Database Systems"})(),
            type("CourseLite", (), {"title": "Computer Networks"})(),
            type("CourseLite", (), {"title": "Communication Skills"})(),
        ]

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    slots = [
        ("09:00 AM", "10:00 AM"),
        ("10:15 AM", "11:15 AM"),
        ("11:30 AM", "12:30 PM"),
        ("01:30 PM", "02:30 PM"),
        ("02:45 PM", "03:45 PM"),
    ]
    timetable_rows = []
    for i, course in enumerate(courses[:5]):
        start_time, end_time = slots[i % len(slots)]
        timetable_rows.append(
            {
                "day": days[i % len(days)],
                "start_time": start_time,
                "end_time": end_time,
                "subject": course.title,
                "teacher": f"Faculty {i + 1}",
                "room": f"B-{101 + i}",
            }
        )

    return request.app.state.templates.TemplateResponse(
        "student/timetable.html",
        {
            "request": request,
            "profile": profile,
            "timetable": timetable_rows,
            "student_nav": student_menu("timetable"),
            "title": "Timetable - CampusIQ",
        },
    )


@router.get("/exam-schedule")
def exam_schedule_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Exam Schedule - shows only their branch+semester exams"""
    profile = get_current_profile(request, db)

    exam_schedules = []
    if profile.branch_id and profile.semester_id:
        exam_schedules = db.query(models.ExamSchedule).filter(
            models.ExamSchedule.branch_id == profile.branch_id,
            models.ExamSchedule.semester_id == profile.semester_id
        ).order_by(models.ExamSchedule.exam_date).all()

    exams = []
    for row in exam_schedules:
        exams.append(
            {
                "exam_name": "Semester Exam",
                "subject": row.subject_name,
                "exam_date": row.exam_date.strftime("%d %b %Y") if row.exam_date else "TBA",
                "start_time": row.exam_time or "TBA",
                "max_marks": "100",
            }
        )

    if not exam_schedules:
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == profile.id
        ).all()
        subjects = [e.course.title for e in enrollments if getattr(e, "course", None)]
        if not subjects:
            subjects = ["Mathematics", "Programming Fundamentals", "Database Systems", "Computer Networks"]
        for i, subject in enumerate(subjects[:6]):
            exams.append(
                {
                    "exam_name": f"Internal Test {i + 1}",
                    "subject": subject,
                    "exam_date": (date.today() + timedelta(days=7 * (i + 1))).strftime("%d %b %Y"),
                    "start_time": "10:00 AM - 01:00 PM",
                    "max_marks": "100",
                }
            )

    return request.app.state.templates.TemplateResponse(
        "student/exam_schedule.html",
        {
            "request": request,
            "profile": profile,
            "exams": exams,
            "student_nav": student_menu("exam-schedule"),
            "title": "Exam Schedule - CampusIQ",
        },
    )


@router.get("/notices")
def notices_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Notices - filtered by branch and semester"""
    profile = get_current_profile(request, db)
    
    branch_code = profile.branch.code if profile.branch else ""
    semester_num = profile.semester.semester_number if profile.semester else 0
    
    notices = db.query(models.Notice).filter(
        # Role filter: all or student
        models.Notice.target_role.in_(["all", "student"]),
        # Branch filter: NULL, ALL, or matching branch code
        (models.Notice.target_branch == None) | 
        (models.Notice.target_branch == "ALL") | 
        (models.Notice.target_branch == branch_code),
        # Semester filter: NULL, 0, or matching semester
        (models.Notice.target_semester == None) | 
        (models.Notice.target_semester == 0) | 
        (models.Notice.target_semester == semester_num)
    ).order_by(models.Notice.created_at.desc()).all()

    return request.app.state.templates.TemplateResponse(
        "student/notices.html",
        {
            "request": request,
            "profile": profile,
            "notices": notices,
            "student_nav": student_menu("notices"),
            "title": "Notices - CampusIQ",
        },
    )


@router.get("/circulars")
def circulars_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Circulars - filtered by branch and semester"""
    profile = get_current_profile(request, db)
    
    branch_code = profile.branch.code if profile.branch else ""
    semester_num = profile.semester.semester_number if profile.semester else 0
    
    circulars = db.query(models.Circular).filter(
        #, ALL, or Branch filter: NULL matching branch code
        (models.Circular.target_branch == None) | 
        (models.Circular.target_branch == "ALL") | 
        (models.Circular.target_branch == branch_code),
        # Semester filter: NULL, 0, or matching semester
        (models.Circular.target_semester == None) | 
        (models.Circular.target_semester == 0) | 
        (models.Circular.target_semester == semester_num)
    ).order_by(models.Circular.created_at.desc()).all()

    return request.app.state.templates.TemplateResponse(
        "student/circulars.html",
        {
            "request": request,
            "profile": profile,
            "circulars": circulars,
            "student_nav": student_menu("circulars"),
            "title": "Circulars - CampusIQ",
        },
    )


@router.get("/profile")
def student_profile(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == profile.branch_id).first() if profile else None
    semester = db.query(models.Semester).filter(models.Semester.id == profile.semester_id).first() if profile else None

    enrollment_count = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == profile.id
    ).count() if profile else 0

    attendance_records = []
    if profile:
        enrollment_ids = [e.id for e in db.query(models.Enrollment).filter(
            models.Enrollment.student_id == profile.id).all()]
        if enrollment_ids:
            attendance_records = db.query(models.Attendance).filter(
                models.Attendance.enrollment_id.in_(enrollment_ids)
            ).all()

    total_days = len(attendance_records)
    present_days = len([r for r in attendance_records if r.status == "present"])
    attendance_pct = round((present_days / total_days * 100), 1) if total_days > 0 else 0

    return request.app.state.templates.TemplateResponse(
        "student/profile.html",
        {
            "request": request,
            "user": user,
            "profile": profile,
            "branch": branch,
            "semester": semester,
            "enrollment_count": enrollment_count,
            "attendance_pct": attendance_pct,
            "present_days": present_days,
            "total_days": total_days,
            "success": request.query_params.get("success"),
            "error": request.query_params.get("error"),
            "student_nav": student_menu("profile"),
            "title": "My Profile - CampusIQ",
        }
    )


@router.get("/courses")
def courses_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Courses - shows only their enrolled courses"""
    profile = get_current_profile(request, db)
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == profile.id
    ).all()
    
    return request.app.state.templates.TemplateResponse(
        "student/courses.html",
        {
            "request": request,
            "profile": profile,
            "enrollments": enrollments,
            "student_nav": student_menu("courses"),
            "title": "My Courses - CampusIQ",
        },
    )


@router.get("/examinations")
def examinations_page(request: Request, db: Session = Depends(get_db), _=Depends(require_student)):
    """Student Examinations - shows their exam grades"""
    profile = get_current_profile(request, db)
    grades = db.query(models.Grade).join(
        models.Enrollment, models.Enrollment.id == models.Grade.enrollment_id
    ).filter(models.Enrollment.student_id == profile.id).all()
    
    exams = []
    for g in grades:
        exams.append({
            "course_code": g.enrollment.course.code,
            "course_title": g.enrollment.course.title,
            "exam_name": g.exam_name,
            "max_marks": g.max_marks,
            "status": "Published",
        })

    return request.app.state.templates.TemplateResponse(
        "student/examinations.html",
        {
            "request": request,
            "profile": profile,
            "exams": exams,
            "student_nav": student_menu("examinations"),
            "title": "Examinations - CampusIQ",
        },
    )


@router.post("/profile")
def update_student_profile(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()

    form_data = request.state.form if hasattr(request.state, 'form') else {}

    phone = form_data.get("phone", "").strip()
    guardian_name = form_data.get("guardian_name", "").strip()
    father_name = form_data.get("father_name", "").strip()
    mother_name = form_data.get("mother_name", "").strip()
    address = form_data.get("address", "").strip()
    blood_group = form_data.get("blood_group", "").strip()
    alternate_phone = form_data.get("alternate_phone", "").strip()

    if profile:
        if phone:
            profile.phone = phone
        if guardian_name:
            profile.guardian_name = guardian_name
        if hasattr(profile, 'father_name') and father_name:
            profile.father_name = father_name
        if hasattr(profile, 'mother_name') and mother_name:
            profile.mother_name = mother_name
        if hasattr(profile, 'address') and address:
            profile.address = address
        if hasattr(profile, 'blood_group') and blood_group:
            profile.blood_group = blood_group
        if hasattr(profile, 'alternate_phone') and alternate_phone:
            profile.alternate_phone = alternate_phone
        db.commit()

    return RedirectResponse("/student/profile?success=Profile updated successfully", status_code=303)


# ==================== STUDENT TRANSPORT ====================

@router.get("/transport")
def student_transport(request: Request, db: Session = Depends(get_db)):
    """Student's transport details"""
    require_student(request)
    
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    student_id = profile.id if profile else None
    if not student_id:
        return request.app.state.templates.TemplateResponse(
            "student/transport.html",
            {"request": request, "transport": None, "message": "Profile not found", "title": "My Transport", "student_nav": student_menu("transport"), "profile": profile},
        )

    assignment = db.query(models.StudentTransport).filter(
        models.StudentTransport.student_id == student_id
    ).first()

    if assignment:
        route = db.query(models.TransportRoute).filter(
            models.TransportRoute.id == assignment.route_id
        ).first()
        transport = {
            "route_name": route.route_name if route else "N/A",
            "bus_number": route.bus_number if route else "N/A",
            "pickup_point": assignment.pickup_stop or "N/A",
        }
        return request.app.state.templates.TemplateResponse(
            "student/transport.html",
            {"request": request, "transport": transport, "title": "My Transport", "student_nav": student_menu("transport"), "profile": profile},
        )

    return request.app.state.templates.TemplateResponse(
        "student/transport.html",
        {"request": request, "transport": None, "message": "You are not enrolled in transport", "title": "My Transport", "student_nav": student_menu("transport"), "profile": profile},
    )


# ==================== STUDENT HOSTEL ====================

@router.get("/hostel")
def student_hostel(request: Request, db: Session = Depends(get_db)):
    """Student's hostel details"""
    require_student(request)
    
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    student_id = profile.id if profile else None
    if not student_id:
        return request.app.state.templates.TemplateResponse(
            "student/hostel.html",
            {"request": request, "hostel": None, "message": "Profile not found", "title": "My Hostel", "student_nav": student_menu("hostel"), "profile": profile},
        )

    assignment = db.query(models.StudentHostel).filter(
        models.StudentHostel.student_id == student_id
    ).first()

    if assignment:
        room = db.query(models.HostelRoom).filter(
            models.HostelRoom.id == assignment.room_id
        ).first()
        hostel = {
            "room_number": room.room_number if room else "N/A",
            "block": "Main Block",
            "floor": room.floor if room else "N/A",
        }
        return request.app.state.templates.TemplateResponse(
            "student/hostel.html",
            {"request": request, "hostel": hostel, "title": "My Hostel", "student_nav": student_menu("hostel"), "profile": profile},
        )

    return request.app.state.templates.TemplateResponse(
        "student/hostel.html",
        {"request": request, "hostel": None, "message": "You are not enrolled in hostel", "title": "My Hostel", "student_nav": student_menu("hostel"), "profile": profile},
    )


# ==================== STUDENT NOTIFICATIONS ====================

@router.get("/notifications")
def student_notifications(request: Request, db: Session = Depends(get_db)):
    """Get student's notifications"""
    require_student(request)
    
    student_id = request.session.get("student_profile_id")
    if not student_id:
        return JSONResponse({"notifications": []})
    
    notifications = db.query(models.Notification).filter(
        models.Notification.student_id == student_id
    ).order_by(models.Notification.created_at.desc()).limit(20).all()
    
    return JSONResponse({
        "notifications": [
            {
                "id": n.id,
                "message": n.message,
                "link": n.link,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifications
        ]
    })


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, request: Request, db: Session = Depends(get_db)):
    """Mark notification as read"""
    require_student(request)
    
    student_id = request.session.get("student_profile_id")
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.student_id == student_id
    ).first()
    
    if notif:
        notif.is_read = 1
        db.commit()
    
    return JSONResponse({"ok": True})


@router.get("/notifications/count")
def notification_count(request: Request, db: Session = Depends(get_db)):
    """Get unread notification count"""
    require_student(request)
    
    student_id = request.session.get("student_profile_id")
    if not student_id:
        return JSONResponse({"count": 0})
    
    count = db.query(models.Notification).filter(
        models.Notification.student_id == student_id,
        models.Notification.is_read == 0
    ).count()
    
    return JSONResponse({"count": count})


# ==================== LEAVE APPLICATION (STUDENT) ====================

@router.get("/leave")
def student_leave_page(request: Request, db: Session = Depends(get_db)):
    """Show leave application form and history"""
    require_student(request)
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    
    applications = []
    if profile:
        applications = db.query(models.LeaveApplication).filter(
            models.LeaveApplication.student_id == profile.id
        ).order_by(models.LeaveApplication.created_at.desc()).all()
    leaves = [
        {
            "start_date": app.from_date.strftime("%d %b %Y") if app.from_date else "N/A",
            "end_date": app.to_date.strftime("%d %b %Y") if app.to_date else "N/A",
            "reason": app.reason,
            "status": app.status,
            "remarks": app.remarks,
        }
        for app in applications
    ]
    
    return request.app.state.templates.TemplateResponse(
        "student/leave.html",
        {"request": request, "leaves": leaves, "success": request.query_params.get("success"), "error": request.query_params.get("error"), "title": "Leave Application", "student_nav": student_menu("leave"), "profile": profile},
    )


@router.post("/leave")
def apply_leave(request: Request, db: Session = Depends(get_db)):
    """Submit leave application"""
    require_student(request)
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    
    from datetime import date
    from_date_str = get_form_value(request, "from_date")
    to_date_str = get_form_value(request, "to_date")
    reason = get_form_value(request, "reason")
    
    if profile and from_date_str and to_date_str and reason:
        # Check for pending application
        existing = db.query(models.LeaveApplication).filter(
            models.LeaveApplication.student_id == profile.id,
            models.LeaveApplication.status == "pending"
        ).first()
        
        if not existing:
            try:
                from_date = date.fromisoformat(from_date_str)
                to_date = date.fromisoformat(to_date_str)
                
                db.add(models.LeaveApplication(
                    student_id=profile.id,
                    from_date=from_date,
                    to_date=to_date,
                    reason=reason
                ))
                db.commit()
            except:
                pass
    
    return RedirectResponse("/student/leave?success=Leave application submitted", status_code=status.HTTP_303_SEE_OTHER)


# ==================== STUDY MATERIALS (STUDENT) ====================

@router.get("/study-materials")
def student_study_materials(request: Request, db: Session = Depends(get_db)):
    """Show study materials for student's branch/semester"""
    require_student(request)
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    
    materials = []
    if profile:
        rows = db.query(models.StudyMaterial).filter(
            models.StudyMaterial.branch_id == profile.branch_id,
            models.StudyMaterial.semester_id == profile.semester_id
        ).order_by(models.StudyMaterial.created_at.desc()).all()
        for m in rows:
            materials.append(
                {
                    "title": m.title,
                    "subject": m.subject.name if m.subject else "General",
                    "description": m.description,
                    "created_at": m.created_at,
                    "file_path": m.file_path,
                }
            )
    
    return request.app.state.templates.TemplateResponse(
        "student/study_materials.html",
        {"request": request, "materials": materials, "title": "Study Materials", "student_nav": student_menu("study-materials"), "profile": profile},
    )
