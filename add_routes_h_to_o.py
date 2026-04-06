# Add all routes for Features H through O

print("=== Adding Routes for Features H through O ===")

# Read admin.py
with open('app/routers/admin.py', 'r') as f:
    admin_content = f.read()

# Feature I: Student Promotion
promotion_route = '''

# ==================== STUDENT PROMOTION ====================

@router.get("/promote-students")
def promote_students_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("students.manage"))):
    branches = db.query(models.Branch).all()
    semesters = db.query(models.Semester).all()
    return request.app.state.templates.TemplateResponse(
        "admin/promote_students.html",
        {"request": request, "branches": branches, "semesters": semesters, "title": "Student Promotion"},
    )


@router.post("/promote-students/preview")
def promote_students_preview(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("students.manage"))):
    branch_id = get_form_value(request, "branch_id")
    current_sem = get_form_value(request, "current_semester")
    new_sem = get_form_value(request, "new_semester")
    
    students = []
    if branch_id and current_sem and new_sem:
        students = db.query(models.StudentProfile).filter(
            models.StudentProfile.branch_id == int(branch_id),
            models.StudentProfile.semester_id == int(current_sem)
        ).all()
        
        for s in students:
            user = db.query(models.User).filter(models.User.id == s.user_id).first()
            s.user_name = user.name if user else "Unknown"
    
    branches = db.query(models.Branch).all()
    semesters = db.query(models.Semester).all()
    
    return request.app.state.templates.TemplateResponse(
        "admin/promote_students.html",
        {
            "request": request,
            "branches": branches,
            "semesters": semesters,
            "preview_students": students,
            "selected_branch": int(branch_id) if branch_id else None,
            "selected_current": int(current_sem) if current_sem else None,
            "selected_new": int(new_sem) if new_sem else None,
            "title": "Student Promotion",
        },
    )


@router.post("/promote-students/confirm")
def promote_students_confirm(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("students.manage"))):
    branch_id = get_form_value(request, "branch_id")
    current_sem = get_form_value(request, "current_semester")
    new_sem = get_form_value(request, "new_semester")
    
    if branch_id and current_sem and new_sem:
        count = db.query(models.StudentProfile).filter(
            models.StudentProfile.branch_id == int(branch_id),
            models.StudentProfile.semester_id == int(current_sem)
        ).update({"semester_id": int(new_sem)})
        db.commit()
        message = f"{count} students promoted successfully"
    else:
        message = "Please select all fields"
    
    branches = db.query(models.Branch).all()
    semesters = db.query(models.Semester).all()
    
    return request.app.state.templates.TemplateResponse(
        "admin/promote_students.html",
        {
            "request": request,
            "branches": branches,
            "semesters": semesters,
            "message": message,
            "title": "Student Promotion",
        },
    )
'''

# Feature L: Academic Years
academic_years_route = '''

# ==================== ACADEMIC YEARS ====================

@router.get("/academic-years")
def academic_years_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("settings.manage"))):
    academic_years = db.query(models.AcademicYear).order_by(models.AcademicYear.start_date.desc()).all()
    return request.app.state.templates.TemplateResponse(
        "admin/academic_years.html",
        {"request": request, "academic_years": academic_years, "title": "Academic Years"},
    )


@router.post("/academic-years/add")
def add_academic_year(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("settings.manage"))):
    from datetime import date
    name = get_form_value(request, "name")
    start_date_str = get_form_value(request, "start_date")
    end_date_str = get_form_value(request, "end_date")
    
    if name and start_date_str and end_date_str:
        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
            db.add(models.AcademicYear(name=name, start_date=start_date, end_date=end_date))
            db.commit()
        except:
            pass
    
    return RedirectResponse("/admin/academic-years", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/academic-years/{year_id}/set-active")
def set_academic_year_active(year_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_perm("settings.manage"))):
    # Deactivate all
    db.query(models.AcademicYear).update({"is_active": 0})
    # Activate selected
    year = db.query(models.AcademicYear).filter(models.AcademicYear.id == year_id).first()
    if year:
        year.is_active = 1
        db.commit()
    
    return RedirectResponse("/admin/academic-years", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/academic-years/{year_id}/delete")
def delete_academic_year(year_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_perm("settings.manage"))):
    year = db.query(models.AcademicYear).filter(models.AcademicYear.id == year_id).first()
    if year:
        db.delete(year)
        db.commit()
    return RedirectResponse("/admin/academic-years", status_code=status.HTTP_303_SEE_OTHER)
'''

# Feature N: Audit Log
audit_log_route = '''

# ==================== AUDIT LOG ====================

@router.get("/audit-log")
def audit_log_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("dashboard.view"))):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100).all()
    return request.app.state.templates.TemplateResponse(
        "admin/audit_log.html",
        {"request": request, "logs": logs, "title": "Audit Log"},
    )
'''

# Feature M: Study Materials Admin
study_materials_admin_route = '''

# ==================== STUDY MATERIALS (ADMIN) ====================

@router.get("/study-materials")
def study_materials_admin_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("courses.view"))):
    materials = db.query(models.StudyMaterial).order_by(models.StudyMaterial.created_at.desc()).all()
    return request.app.state.templates.TemplateResponse(
        "admin/study_materials.html",
        {"request": request, "materials": materials, "title": "Study Materials"},
    )


@router.post("/study-materials/{material_id}/delete")
def delete_study_material(material_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_perm("courses.manage"))):
    material = db.query(models.StudyMaterial).filter(models.StudyMaterial.id == material_id).first()
    if material:
        db.delete(material)
        db.commit()
    return RedirectResponse("/admin/study-materials", status_code=status.HTTP_303_SEE_OTHER)
'''

# Add all routes to admin.py
admin_content = admin_content + promotion_route + academic_years_route + audit_log_route + study_materials_admin_route

with open('app/routers/admin.py', 'w') as f:
    f.write(admin_content)

print("Admin routes added")

# Read teacher.py
with open('app/routers/teacher.py', 'r') as f:
    teacher_content = f.read()

# Feature H: Leave Applications (Teacher)
leave_teacher_route = '''

# ==================== LEAVE APPLICATIONS (TEACHER) ====================

@router.get("/leave-applications")
def teacher_leave_applications(request: Request, db: Session = Depends(get_db)):
    """Show all leave applications from students in teacher's branch/semester"""
    require_teacher(request)
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    
    # Get students in teacher's branch/semester
    student_ids = db.query(models.StudentProfile.id).filter(
        models.StudentProfile.branch_id == branch_id,
        models.StudentProfile.semester_id == semester_id
    ).all()
    student_ids = [s.id for s in student_ids]
    
    applications = []
    if student_ids:
        applications = db.query(models.LeaveApplication).filter(
            models.LeaveApplication.student_id.in_(student_ids)
        ).order_by(models.LeaveApplication.created_at.desc()).all()
        
        for app in applications:
            student = db.query(models.StudentProfile).filter(models.StudentProfile.id == app.student_id).first()
            if student:
                user = db.query(models.User).filter(models.User.id == student.user_id).first()
                app.student_name = user.name if user else "Unknown"
                app.roll_no = student.roll_no
    
    return request.app.state.templates.TemplateResponse(
        "teacher/leave_applications.html",
        {"request": request, "applications": applications, "title": "Leave Applications"},
    )


@router.post("/leave-applications/{app_id}/approve")
def approve_leave_application(app_id: int, request: Request, db: Session = Depends(get_db)):
    """Approve a leave application"""
    require_teacher(request)
    user_id = request.session.get("user_id")
    
    app = db.query(models.LeaveApplication).filter(models.LeaveApplication.id == app_id).first()
    if app:
        app.status = "approved"
        app.reviewed_by = user_id
        app.reviewed_at = datetime.utcnow()
        db.commit()
    
    return RedirectResponse("/teacher/leave-applications", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/leave-applications/{app_id}/reject")
def reject_leave_application(app_id: int, request: Request, db: Session = Depends(get_db)):
    """Reject a leave application"""
    require_teacher(request)
    user_id = request.session.get("user_id")
    remarks = get_form_value(request, "remarks", "")
    
    app = db.query(models.LeaveApplication).filter(models.LeaveApplication.id == app_id).first()
    if app:
        app.status = "rejected"
        app.reviewed_by = user_id
        app.reviewed_at = datetime.utcnow()
        app.remarks = remarks
        db.commit()
    
    return RedirectResponse("/teacher/leave-applications", status_code=status.HTTP_303_SEE_OTHER)


# ==================== STUDY MATERIALS (TEACHER) ====================

@router.get("/study-materials")
def teacher_study_materials(request: Request, db: Session = Depends(get_db)):
    """Show study materials uploaded by teacher"""
    require_teacher(request)
    user_id = request.session.get("user_id")
    materials = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.uploaded_by == user_id
    ).order_by(models.StudyMaterial.created_at.desc()).all()
    
    return request.app.state.templates.TemplateResponse(
        "teacher/study_materials.html",
        {"request": request, "materials": materials, "title": "Study Materials"},
    )


@router.post("/study-materials/add")
def add_study_material(request: Request, db: Session = Depends(get_db)):
    """Upload study material"""
    require_teacher(request)
    user_id = request.session.get("user_id")
    branch_id = request.session.get("branch_id")
    semester_id = request.session.get("semester_id")
    subject_id = request.session.get("subject_id")
    
    title = get_form_value(request, "title")
    description = get_form_value(request, "description", "")
    
    if title:
        # For now, just save without actual file upload
        file_path = f"/static/uploads/{title}.pdf"
        file_name = f"{title}.pdf"
        
        db.add(models.StudyMaterial(
            title=title,
            description=description,
            file_path=file_path,
            file_name=file_name,
            subject_id=subject_id,
            branch_id=branch_id,
            semester_id=semester_id,
            uploaded_by=user_id
        ))
        db.commit()
    
    return RedirectResponse("/teacher/study-materials", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/study-materials/{material_id}/delete")
def delete_teacher_study_material(material_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete study material"""
    require_teacher(request)
    user_id = request.session.get("user_id")
    
    material = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.id == material_id,
        models.StudyMaterial.uploaded_by == user_id
    ).first()
    
    if material:
        db.delete(material)
        db.commit()
    
    return RedirectResponse("/teacher/study-materials", status_code=status.HTTP_303_SEE_OTHER)
'''

teacher_content = teacher_content + leave_teacher_route

with open('app/routers/teacher.py', 'w') as f:
    f.write(teacher_content)

print("Teacher routes added")

# Read student.py
with open('app/routers/student.py', 'r') as f:
    student_content = f.read()

# Feature H: Leave Applications (Student)
leave_student_route = '''

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
    
    # Check for pending application
    has_pending = any(app.status == "pending" for app in applications)
    
    return request.app.state.templates.TemplateResponse(
        "student/leave.html",
        {"request": request, "applications": applications, "has_pending": has_pending, "title": "Leave Application"},
    )


@router.post("/leave/apply")
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
    
    return RedirectResponse("/student/leave", status_code=status.HTTP_303_SEE_OTHER)


# ==================== STUDY MATERIALS (STUDENT) ====================

@router.get("/study-materials")
def student_study_materials(request: Request, db: Session = Depends(get_db)):
    """Show study materials for student's branch/semester"""
    require_student(request)
    user_id = request.session.get("user_id")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    
    materials = []
    if profile:
        materials = db.query(models.StudyMaterial).filter(
            models.StudyMaterial.branch_id == profile.branch_id,
            models.StudyMaterial.semester_id == profile.semester_id
        ).order_by(models.StudyMaterial.created_at.desc()).all()
        
        for m in materials:
            m.subject_name = m.subject.name if m.subject else "General"
    
    return request.app.state.templates.TemplateResponse(
        "student/study_materials.html",
        {"request": request, "materials": materials, "title": "Study Materials"},
    )
'''

student_content = student_content + leave_student_route

with open('app/routers/student.py', 'w') as f:
    f.write(student_content)

print("Student routes added")

# Add datetime import to teacher.py if not present
with open('app/routers/teacher.py', 'r') as f:
    teacher_content = f.read()

if 'from datetime import' not in teacher_content or 'datetime' not in teacher_content:
    teacher_content = 'from datetime import datetime\n' + teacher_content
    with open('app/routers/teacher.py', 'w') as f:
        f.write(teacher_content)

print("\n=== All Routes for H through O Added ===")
