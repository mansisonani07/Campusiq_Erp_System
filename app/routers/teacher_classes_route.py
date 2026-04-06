from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

# Add this route after the MY STUDENTS section in app/routers/teacher.py

@router.get("/classes")
def teacher_classes(request: Request, db: Session = Depends(get_db)):
    \"\"\"Teacher classes page - list students with attendance status\"\"\"
    if request.session.get("role") != "teacher":
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    if not branch_id or not semester_id:
        return RedirectResponse("/teacher/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    
    # Get teacher's branch/semester info
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).first()
    if not teacher:
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
    
    branch = db.query(models.Branch).filter(models.Branch.id == teacher.branch_id).first()
    semester = db.query(models.Semester).filter(models.Semester.id == teacher.semester_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    # Get students in teacher's class
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.branch_id == teacher.branch_id,
        models.StudentProfile.semester_id == teacher.semester_id
    ).all()
    
    student_list = []
    for student in students:
        # Calculate attendance %
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id
        ).all()
        enrollment_ids = [e.id for e in enrollments]
        records = db.query(models.Attendance).filter(
            models.Attendance.enrollment_id.in_(enrollment_ids)
        ).all() if enrollment_ids else []
        total = len(records)
        present = len([r for r in records if r.status == "present"])
        attendance_pct = round((present / total * 100), 1) if total > 0 else 0
        
        student_list.append({
            "id": student.id,
            "user": student.user,
            "roll_no": student.roll_no,
            "department": student.department,
            "year": student.year,
            "attendance_pct": attendance_pct
        })
    
    return request.app.state.templates.TemplateResponse(
        "teacher/classes.html",
        {
            "request": request,
            "user": user,
            "branch": branch,
            "semester": semester,
            "students": student_list,
            "total_students": len(students)
        }
    )

