from datetime import date, datetime
import os
import shutil
from fastapi import APIRouter, Depends, Request, HTTPException, status, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..form_parser import get_form_value

router = APIRouter(prefix="/teacher", tags=["teacher"])

UPLOAD_DIR = "app/static/uploads/study-materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def require_teacher(request: Request):
    """Require teacher role - redirect if not teacher"""
    role = request.session.get("role")
    if role != "teacher":
        # Redirect to appropriate dashboard
        if role == "admin":
            return RedirectResponse("/admin/dashboard")
        elif role == "student":
            return RedirectResponse("/student/dashboard")
        else:
            return RedirectResponse("/login")
    return True


def get_teacher_profile(request: Request, db: Session):
    """Get teacher's profile with branch and semester info"""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=403, detail="Teacher profile not found")
    return profile


def filter_notices_for_teacher(notices, teacher_branch_name, teacher_semester):
    """Filter notices based on teacher's branch and semester"""
    filtered = []
    for notice in notices:
        # Check role targeting
        if notice.target_role not in ["all", "teacher"]:
            continue
        
        # Check branch targeting
        if notice.target_branch and notice.target_branch != "ALL":
            if notice.target_branch != teacher_branch_name:
                continue
        
        # Check semester targeting
        if notice.target_semester and notice.target_semester != 0:
            if notice.target_semester != teacher_semester:
                continue
        
        filtered.append(notice)
    return filtered


def filter_circulars_for_teacher(circulars, teacher_branch_name, teacher_semester):
    """Filter circulars based on teacher's branch and semester"""
    filtered = []
    for circular in circulars:
        # Check branch targeting
        if circular.target_branch and circular.target_branch != "ALL":
            if circular.target_branch != teacher_branch_name:
                continue
        
        # Check semester targeting
        if circular.target_semester and circular.target_semester != 0:
            if circular.target_semester != teacher_semester:
                continue
        
        filtered.append(circular)
    return filtered


# ==================== TEACHER DASHBOARD ====================

@router.get("/dashboard")
def teacher_dashboard(request: Request, db: Session = Depends(get_db)):
    from datetime import date
    if request.session.get("role") != "teacher":
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

    user_id = request.session.get("user_id")
    teacher = get_teacher_profile(request, db)
    branch_id = teacher.branch_id
    semester_id = teacher.semester_id
    request.session["branch_id"] = branch_id
    request.session["semester_id"] = semester_id

    user = db.query(models.User).filter(models.User.id == user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()

    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == branch_id,
        models.StudentProfile.semester_id == semester_id
    ).all()

    today = date.today()
    present_today = 0
    absent_today = 0

    for student in students:
        enrollment_ids = [e.id for e in db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()]
        if enrollment_ids:
            record = db.query(models.Attendance).filter(
                models.Attendance.enrollment_id.in_(enrollment_ids),
                models.Attendance.date == today
            ).first()
            if record:
                if record.status == "present":
                    present_today += 1
                else:
                    absent_today += 1

    low_attendance = []
    for student in students:
        enrollment_ids = [e.id for e in db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()]
        if enrollment_ids:
            records = db.query(models.Attendance).filter(
                models.Attendance.enrollment_id.in_(enrollment_ids)
            ).all()
            total = len(records)
            present = len([r for r in records if r.status == "present"])
            pct = round((present / total * 100), 1) if total > 0 else 0
            if pct < 75:
                low_attendance.append({
                    "name": student.user.name,
                    "roll_no": student.roll_no,
                    "pct": pct
                })

    pending_leaves = []
    for student in students:
        leaves = db.query(models.LeaveApplication).filter(
            models.LeaveApplication.student_id == student.id,
            models.LeaveApplication.status == "pending"
        ).all()
        for leave in leaves:
            pending_leaves.append({
                "student_name": student.user.name,
                "roll_no": student.roll_no,
                "reason": leave.reason,
                "from_date": leave.start_date,
                "to_date": leave.end_date
            })

    notices = db.query(models.Notice).filter(
        models.Notice.target_role.in_(["all", "staff", "teacher"])
    ).order_by(models.Notice.created_at.desc()).limit(3).all()

    exam_schedules = db.query(models.ExamSchedule).filter(
        models.ExamSchedule.branch_id == branch_id,
        models.ExamSchedule.semester_id == semester_id
    ).order_by(models.ExamSchedule.exam_date).limit(5).all()

    return request.app.state.templates.TemplateResponse(
        "teacher/dashboard.html",
        {
            "request": request,
            "user": user,
            "branch": branch,
            "semester": semester,
            "student_count": len(students),
            "present_today": present_today,
            "absent_today": absent_today,
            "not_marked_today": len(students) - present_today - absent_today,
            "low_attendance": low_attendance,
            "low_attendance_count": len(low_attendance),
            "pending_leaves": pending_leaves,
            "pending_leaves_count": len(pending_leaves),
            "notices": notices,
            "exam_schedules": exam_schedules,
        }
    )


# ==================== MY STUDENTS ====================

@router.get("/students")
def teacher_students(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == branch_id,
        models.StudentProfile.semester_id == semester_id
    ).all()
    
    student_data = []
    for student in students:
        # Get enrollments for this student first
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()
        enrollment_ids = [e.id for e in enrollments]
        
        # Then get attendance through enrollment
        records = db.query(models.Attendance).filter(
            models.Attendance.enrollment_id.in_(enrollment_ids)
        ).all() if enrollment_ids else []
        total = len(records)
        present = len([r for r in records if r.status == "present"])
        attendance_pct = round((present / total * 100), 1) if total > 0 else 0
        
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()
        all_grades = []
        for enrollment in enrollments:
            grades = db.query(models.Grade).filter(
                models.Grade.enrollment_id == enrollment.id
            ).all()
            for grade in grades:
                if grade.max_marks > 0:
                    all_grades.append((grade.marks_obtained / grade.max_marks) * 100)
        avg_marks = round(sum(all_grades) / len(all_grades), 1) if all_grades else 0
        
        pending_leaves = db.query(models.LeaveApplication).filter(
            models.LeaveApplication.student_id == student.id,
            models.LeaveApplication.status == "pending"
        ).count()
        
        student_data.append({
            "profile": student,
            "name": student.user.name,
            "email": student.user.email,
            "roll_no": student.roll_no,
            "phone": student.phone,
            "attendance_pct": attendance_pct,
            "avg_marks": avg_marks,
            "pending_leaves": pending_leaves,
        })
    
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    return request.app.state.templates.TemplateResponse(
        "teacher/students.html",
        {
            "request": request,
            "user": user,
            "student_data": student_data,
            "branch": branch,
            "semester": semester,
            "total_students": len(students),
            "low_attendance_count": len([s for s in student_data if s["attendance_pct"] < 75]),
            "pending_leaves_count": sum(s["pending_leaves"] for s in student_data)
        }
    )


# ==================== ATTENDANCE ====================

@router.get("/attendance")
def teacher_attendance(request: Request, db: Session = Depends(get_db)):
    """Teacher attendance marking page"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    
    # Get date from query params or default to today
    date_str = request.query_params.get("date", date.today().isoformat())
    try:
        selected_date = date.fromisoformat(date_str)
    except ValueError:
        selected_date = date.today()
    
    # Get students in teacher's class using branch_id and semester_id
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == teacher.branch_id,
        models.StudentProfile.semester_id == teacher.semester_id
    ).all()
    
    # Get existing attendance for this date
    student_ids = [s.id for s in students]
    existing_attendance = {}
    if student_ids:
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id.in_(student_ids)
        ).all()
        enrollment_ids = [e.id for e in enrollments]
        if enrollment_ids:
            attendance_records = db.query(models.Attendance).filter(
                models.Attendance.enrollment_id.in_(enrollment_ids),
                models.Attendance.date == selected_date
            ).all()
            for att in attendance_records:
                for e in enrollments:
                    if e.id == att.enrollment_id:
                        existing_attendance[e.student_id] = att.status
                        break
    
    # Get past attendance records
    past_attendance = []
    if student_ids:
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id.in_(student_ids)
        ).all()
        enrollment_ids = [e.id for e in enrollments]
        if enrollment_ids:
            past_records = db.query(models.Attendance).filter(
                models.Attendance.enrollment_id.in_(enrollment_ids),
                models.Attendance.date != selected_date
            ).order_by(models.Attendance.date.desc()).limit(100).all()
            
            # Map enrollment to student
            enrollment_to_student = {e.id: e.student_id for e in enrollments}
            for rec in past_records:
                student_id = enrollment_to_student.get(rec.enrollment_id)
                if student_id:
                    student = next((s for s in students if s.id == student_id), None)
                    if student:
                        past_attendance.append({
                            "date": rec.date,
                            "student": student,
                            "status": rec.status
                        })
    
    # Calculate attendance summary for all students
    attendance_summary = []
    for student in students:
        records = db.query(models.Attendance).join(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()
        total = len(records)
        present = len([r for r in records if r.status == "present"])
        absent = total - present
        percentage = round((present / total * 100), 1) if total > 0 else 0
        attendance_summary.append({
            "roll_no": student.roll_no,
            "name": student.user.name,
            "total": total,
            "present": present,
            "absent": absent,
            "percentage": percentage
        })
    
    return request.app.state.templates.TemplateResponse(
        "teacher/attendance.html",
        {
            "request": request,
            "students": students,
            "selected_date": selected_date,
            "existing_attendance": existing_attendance,
            "past_attendance": past_attendance,
            "attendance_summary": attendance_summary,
            "branch": branch,
            "semester": semester,
        },
    )


@router.post("/attendance")
def mark_attendance(request: Request, db: Session = Depends(get_db)):
    """Submit attendance for teacher's class"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    
    # Get date from form
    date_str = get_form_value(request, "date", date.today().isoformat())
    try:
        selected_date = date.fromisoformat(date_str)
    except ValueError:
        selected_date = date.today()
    
    # Get students in teacher's class using branch_id and semester_id
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == teacher.branch_id,
        models.StudentProfile.semester_id == teacher.semester_id
    ).all()
    
    student_ids = [s.id for s in students]
    
    # Get enrollments for these students
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id.in_(student_ids)
    ).all()
    
    enrollment_by_student = {e.student_id: e for e in enrollments}
    
    # Process each student's attendance
    for student in students:
        status_val = get_form_value(request, f"status_{student.id}")
        if status_val in ["present", "absent"]:
            enrollment = enrollment_by_student.get(student.id)
            if enrollment:
                # Check if attendance already exists for this date
                existing = db.query(models.Attendance).filter(
                    models.Attendance.enrollment_id == enrollment.id,
                    models.Attendance.date == selected_date
                ).first()
                
                if existing:
                    existing.status = status_val
                else:
                    db.add(models.Attendance(
                        enrollment_id=enrollment.id,
                        date=selected_date,
                        status=status_val
                    ))
    
    db.commit()
    return RedirectResponse(f"/teacher/attendance?date={selected_date.isoformat()}", status_code=status.HTTP_303_SEE_OTHER)


# ==================== MARKS/GRADES ====================

@router.get("/grades")
def teacher_grades(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == branch_id,
        models.StudentProfile.semester_id == semester_id
    ).all()
    
    student_list = []
    for student in students:
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()
        enrollment_ids = [e.id for e in enrollments]
        grades = db.query(models.Grade).filter(
            models.Grade.enrollment_id.in_(enrollment_ids)
        ).all() if enrollment_ids else []
        
        student_list.append({
            "id": student.id,
            "roll_no": student.roll_no,
            "name": student.user.name
        })
    
    all_grades = db.query(models.Grade).join(
        models.Enrollment,
        models.Grade.enrollment_id == models.Enrollment.id
    ).filter(
        models.Enrollment.student_id.in_([s.id for s in students])
    ).all()
    
    grade_rows = []
    for grade in all_grades:
        enrollment = db.query(models.Enrollment).filter(
            models.Enrollment.id == grade.enrollment_id
        ).first()
        if enrollment:
            student = db.query(models.StudentProfile).filter(
                models.StudentProfile.id == enrollment.student_id
            ).first()
            course = db.query(models.Course).filter(
                models.Course.id == enrollment.course_id
            ).first()
            if student and course:
                pct = round((grade.marks_obtained / grade.max_marks * 100), 1) if grade.max_marks > 0 else 0
                grade_rows.append({
                    "roll_no": student.roll_no,
                    "name": student.user.name,
                    "course": course.title,
                    "exam": grade.exam_name,
                    "marks": f"{grade.marks_obtained}/{grade.max_marks}",
                    "percentage": pct,
                    "status": "Pass" if pct >= 40 else "Fail"
                })
    
    exam_names = list(set([g["exam"] for g in grade_rows]))
    
    exam_summaries = []
    for exam in exam_names:
        exam_grades = [g for g in grade_rows if g["exam"] == exam]
        percentages = [g["percentage"] for g in exam_grades]
        if percentages:
            exam_summaries.append({
                "exam": exam,
                "count": len(percentages),
                "average": round(sum(percentages) / len(percentages), 1),
                "highest": max(percentages),
                "lowest": min(percentages),
                "pass_count": len([p for p in percentages if p >= 40]),
                "fail_count": len([p for p in percentages if p < 40])
            })
    
    return request.app.state.templates.TemplateResponse(
        "teacher/grades.html",
        {
            "request": request,
            "user": user,
            "branch": branch,
            "semester": semester,
            "student_list": student_list,
            "grade_rows": grade_rows,
            "exam_summaries": exam_summaries,
            "total_students": len(students)
        }
    )


@router.post("/grades")
def add_grade(request: Request, db: Session = Depends(get_db)):
    """Add or update a grade for a student"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    
    enrollment_id_str = get_form_value(request, "enrollment_id")
    exam_name = get_form_value(request, "exam_name")
    max_marks_str = get_form_value(request, "max_marks")
    marks_obtained_str = get_form_value(request, "marks_obtained")
    
    enrollment_id = int(enrollment_id_str) if enrollment_id_str and enrollment_id_str.isdigit() else 0
    max_marks = float(max_marks_str) if max_marks_str else 0.0
    marks_obtained = float(marks_obtained_str) if marks_obtained_str else 0.0
    
    if enrollment_id and exam_name and max_marks > 0:
        # Verify enrollment belongs to teacher's class
        enrollment = db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()
        if enrollment:
            student = db.query(models.StudentProfile).filter(models.StudentProfile.id == enrollment.student_id).first()
            if student:
                teacher_profile = get_teacher_profile(request, db)
                branch = db.query(models.Branch).filter(models.Branch.id == teacher_profile.branch_id).first()
                semester = db.query(models.Semester).filter(models.Semester.id == teacher_profile.semester_id).first()
                
                # Verify student belongs to teacher's class
                if student.department == branch.name and student.year == semester.semester_number:
                    # Check if grade already exists for this exam
                    existing = db.query(models.Grade).filter(
                        models.Grade.enrollment_id == enrollment_id,
                        models.Grade.exam_name == exam_name
                    ).first()
                    
                    if existing:
                        existing.max_marks = max_marks
                        existing.marks_obtained = marks_obtained
                    else:
                        db.add(models.Grade(
                            enrollment_id=enrollment_id,
                            exam_name=exam_name,
                            max_marks=max_marks,
                            marks_obtained=marks_obtained
                        ))
                    db.commit()
    
    return RedirectResponse("/teacher/grades", status_code=status.HTTP_303_SEE_OTHER)


# ==================== NOTICES (READ ONLY) ====================

@router.get("/notices")
def teacher_notices(request: Request, db: Session = Depends(get_db)):
    """Teacher notices page - read only"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    
    # Get all notices and filter
    all_notices = db.query(models.Notice).order_by(models.Notice.created_at.desc()).all()
    notices = filter_notices_for_teacher(
        all_notices,
        branch.name if branch else "",
        semester.semester_number if semester else 0
    )
    
    return request.app.state.templates.TemplateResponse(
        "teacher/notices.html",
        {
            "request": request,
            "notices": notices,
            "branch": branch,
            "semester": semester,
        },
    )


# ==================== CIRCULARS (READ ONLY) ====================

@router.get("/circulars")
def teacher_circulars(request: Request, db: Session = Depends(get_db)):
    """Teacher circulars page - read only"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    
    # Get all circulars and filter
    all_circulars = db.query(models.Circular).order_by(models.Circular.created_at.desc()).all()
    circulars = filter_circulars_for_teacher(
        all_circulars,
        branch.name if branch else "",
        semester.semester_number if semester else 0
    )
    
    return request.app.state.templates.TemplateResponse(
        "teacher/circulars.html",
        {
            "request": request,
            "circulars": circulars,
            "branch": branch,
            "semester": semester,
        },
    )


# ==================== EXAM SCHEDULE (READ ONLY) ====================

@router.get("/exam-schedule")
def teacher_exam_schedule(request: Request, db: Session = Depends(get_db)):
    """Teacher exam schedule page - read only"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    
    # Get exam schedules for teacher's class
    exam_schedules = db.query(models.ExamSchedule).filter(
        models.ExamSchedule.branch_id == teacher.branch_id,
        models.ExamSchedule.semester_id == teacher.semester_id
    ).order_by(models.ExamSchedule.exam_date.asc()).all()
    
    return request.app.state.templates.TemplateResponse(
        "teacher/exam_schedule.html",
        {
            "request": request,
            "exam_schedules": exam_schedules,
            "branch": branch,
            "semester": semester,
        },
    )


# ==================== MY PROFILE ====================

@router.get("/profile")
def teacher_profile(request: Request, db: Session = Depends(get_db)):
    """Teacher profile page"""
    if request.session.get("role") != "teacher":
        return RedirectResponse("/teacher/dashboard" if request.session.get("role") == "teacher" else "/login")
    
    teacher = get_teacher_profile(request, db)
    user = db.query(models.User).filter(models.User.id == teacher.user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    
    return request.app.state.templates.TemplateResponse(
        "teacher/profile.html",
        {
            "request": request,
            "user": user,
            "teacher": teacher,
            "branch": branch,
            "semester": semester,
        },
    )


# ==================== LEAVE APPLICATIONS (TEACHER) ====================

@router.get("/leave-applications")
def teacher_leave_applications(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == branch_id,
        models.StudentProfile.semester_id == semester_id
    ).all()
    student_ids = [s.id for s in students]
    
    leaves = db.query(models.LeaveApplication).filter(
        models.LeaveApplication.student_id.in_(student_ids)
    ).order_by(models.LeaveApplication.created_at.desc()).all()
    
    leave_data = []
    for leave in leaves:
        student = db.query(models.StudentProfile).filter(
            models.StudentProfile.id == leave.student_id
        ).first()
        leave_data.append({
            "id": leave.id,
            "student_name": student.user.name if student else "Unknown",
            "roll_no": student.roll_no if student else "N/A",
            "reason": leave.reason,
            "from_date": leave.start_date,
            "to_date": leave.end_date,
            "status": leave.status,
            "created_at": leave.created_at,
            "remarks": getattr(leave, "remarks", "")
        })
    
    pending_count = len([l for l in leave_data if l["status"] == "pending"])
    approved_count = len([l for l in leave_data if l["status"] == "approved"])
    rejected_count = len([l for l in leave_data if l["status"] == "rejected"])
    
    return request.app.state.templates.TemplateResponse(
        "teacher/leave_applications.html",
        {
            "request": request,
            "user": user,
            "branch": branch,
            "semester": semester,
            "leave_data": leave_data,
            "pending_count": pending_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count
        }
    )


@router.post("/leave-applications/{leave_id}/approve")
def approve_leave(leave_id: int, request: Request, db: Session = Depends(get_db)):
    leave = db.query(models.LeaveApplication).filter(
        models.LeaveApplication.id == leave_id
    ).first()
    if leave:
        leave.status = "approved"
        remarks = request.session.get("_remarks", "Approved by teacher")
        if hasattr(leave, "remarks"):
            leave.remarks = remarks
        db.commit()
    return RedirectResponse("/teacher/leave-applications", status_code=303)


@router.post("/leave-applications/{leave_id}/reject")
def reject_leave(leave_id: int, request: Request, db: Session = Depends(get_db)):
    leave = db.query(models.LeaveApplication).filter(
        models.LeaveApplication.id == leave_id
    ).first()
    if leave:
        leave.status = "rejected"
        if hasattr(leave, "remarks"):
            leave.remarks = "Rejected by teacher"
        db.commit()
    return RedirectResponse("/teacher/leave-applications", status_code=303)


# ==================== STUDY MATERIALS (TEACHER) ====================

@router.get("/study-materials")
def teacher_study_materials(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    
    materials = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.branch_id == branch_id,
        models.StudyMaterial.semester_id == semester_id
    ).order_by(models.StudyMaterial.created_at.desc()).all()
    
    return request.app.state.templates.TemplateResponse(
        "teacher/study_materials.html",
        {
            "request": request,
            "user": user,
            "branch": branch,
            "semester": semester,
            "materials": materials
        }
    )


@router.post("/study-materials")
async def upload_study_material(
    request: Request,
    db: Session = Depends(get_db),
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...)
):
    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    safe_filename = f"{user_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    material = models.StudyMaterial(
        title=title,
        description=description,
        file_path=f"/static/uploads/study-materials/{safe_filename}",
        subject=file.filename,
        branch_id=branch_id,
        semester_id=semester_id,
        uploaded_by=user_id
    )
    db.add(material)
    db.commit()
    
    return RedirectResponse("/teacher/study-materials", status_code=303)


@router.post("/study-materials/{material_id}/delete")
def delete_study_material(material_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    material = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.id == material_id,
        models.StudyMaterial.uploaded_by == user_id
    ).first()
    if material:
        file_full_path = f"app{material.file_path}"
        if os.path.exists(file_full_path):
            os.remove(file_full_path)
        db.delete(material)
        db.commit()
    return RedirectResponse("/teacher/study-materials", status_code=303)
