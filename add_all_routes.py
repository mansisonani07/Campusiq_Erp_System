# Add all feature routes

print("=== Adding Feature Routes ===")

# Read admin.py and add routes
with open('app/routers/admin.py', 'r') as f:
    admin_content = f.read()

# Feature A: Subject Management
subjects_route = '''

# ==================== SUBJECT MANAGEMENT ====================

@router.get("/subjects")
def subjects_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("courses.view"))):
    subjects = db.query(models.Subject).all()
    branches = db.query(models.Branch).all()
    semesters = db.query(models.Semester).all()
    return request.app.state.templates.TemplateResponse(
        "admin/subjects.html",
        {"request": request, "subjects": subjects, "branches": branches, "semesters": semesters, "title": "Subject Management"},
    )


@router.post("/subjects/add")
def add_subject(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("courses.manage"))):
    name = get_form_value(request, "name")
    code = get_form_value(request, "code")
    branch_id = get_form_value(request, "branch_id")
    semester_id = get_form_value(request, "semester_id")
    
    if name and code:
        db.add(models.Subject(
            name=name,
            code=code,
            branch_id=int(branch_id) if branch_id else None,
            semester_id=int(semester_id) if semester_id else None
        ))
        db.commit()
    
    return RedirectResponse("/admin/subjects", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/subjects/{subject_id}/delete")
def delete_subject(subject_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_perm("courses.manage"))):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if subject:
        db.delete(subject)
        db.commit()
    return RedirectResponse("/admin/subjects", status_code=status.HTTP_303_SEE_OTHER)
'''

# Feature C: Fee Structure Management
fee_structure_route = '''

# ==================== FEE STRUCTURE MANAGEMENT ====================

@router.get("/fee-structure")
def fee_structure_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("fees.view"))):
    fee_structures = db.query(models.FeeStructure).all()
    branches = db.query(models.Branch).all()
    semesters = db.query(models.Semester).all()
    return request.app.state.templates.TemplateResponse(
        "admin/fee_structure.html",
        {"request": request, "fee_structures": fee_structures, "branches": branches, "semesters": semesters, "title": "Fee Structure Management"},
    )


@router.post("/fee-structure/add")
def add_fee_structure(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("fees.manage"))):
    from datetime import date
    branch_id = get_form_value(request, "branch_id")
    semester_id = get_form_value(request, "semester_id")
    total_amount = get_form_value(request, "total_amount")
    academic_year = get_form_value(request, "academic_year")
    
    if branch_id and semester_id and total_amount and academic_year:
        # Create fee structure
        fs = db.add(models.FeeStructure(
            branch_id=int(branch_id),
            semester_id=int(semester_id),
            total_amount=float(total_amount),
            academic_year=academic_year
        ))
        db.flush()
        
        # Auto-create fee records for all students in branch+semester
        students = db.query(models.StudentProfile).filter(
            models.StudentProfile.branch_id == int(branch_id),
            models.StudentProfile.semester_id == int(semester_id)
        ).all()
        
        for student in students:
            # Check if fee record already exists
            existing = db.query(models.FeeRecord).filter(
                models.FeeRecord.student_id == student.id
            ).first()
            if not existing:
                db.add(models.FeeRecord(
                    student_id=student.id,
                    amount_due=float(total_amount),
                    amount_paid=0,
                    due_date=date(2026, 6, 30),
                    status="pending"
                ))
        
        db.commit()
    
    return RedirectResponse("/admin/fee-structure", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/fee-structure/{fs_id}/delete")
def delete_fee_structure(fs_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_perm("fees.manage"))):
    fs = db.query(models.FeeStructure).filter(models.FeeStructure.id == fs_id).first()
    if fs:
        db.delete(fs)
        db.commit()
    return RedirectResponse("/admin/fee-structure", status_code=status.HTTP_303_SEE_OTHER)
'''

# Feature D: Student ID Card
id_card_route = '''

# ==================== STUDENT ID CARD ====================

@router.get("/students/{student_id}/id-card")
def student_id_card(student_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_perm("students.view"))):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")
    
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == profile.branch_id).first() if profile.branch_id else None
    semester = db.query(models.Semester).filter(models.Semester.id == profile.semester_id).first() if profile.semester_id else None
    
    return request.app.state.templates.TemplateResponse(
        "admin/student_id_card.html",
        {
            "request": request,
            "student": user,
            "profile": profile,
            "branch": branch,
            "semester": semester,
            "title": f"ID Card - {user.name if user else 'Student'}",
        },
    )
'''

# Feature E: Attendance Report
attendance_report_route = '''

# ==================== ATTENDANCE REPORT ====================

@router.get("/attendance/report")
def attendance_report_page(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("attendance.view"))):
    branches = db.query(models.Branch).all()
    semesters = db.query(models.Semester).all()
    
    branch_id = request.query_params.get("branch_id")
    semester_id = request.query_params.get("semester_id")
    
    report_data = []
    if branch_id and semester_id:
        students = db.query(models.StudentProfile).filter(
            models.StudentProfile.branch_id == int(branch_id),
            models.StudentProfile.semester_id == int(semester_id)
        ).all()
        
        for student in students:
            user = db.query(models.User).filter(models.User.id == student.user_id).first()
            enrollments = db.query(models.Enrollment).filter(
                models.Enrollment.student_id == student.id
            ).all()
            
            total_classes = 0
            present = 0
            absent = 0
            
            for enrollment in enrollments:
                attendance = db.query(models.Attendance).filter(
                    models.Attendance.enrollment_id == enrollment.id
                ).all()
                total_classes += len(attendance)
                present += sum(1 for a in attendance if a.status == "present")
                absent += sum(1 for a in attendance if a.status == "absent")
            
            pct = round((present / total_classes * 100), 2) if total_classes > 0 else 0
            report_data.append({
                "name": user.name if user else "Unknown",
                "roll_no": student.roll_no,
                "total": total_classes,
                "present": present,
                "absent": absent,
                "percentage": pct
            })
    
    return request.app.state.templates.TemplateResponse(
        "admin/attendance_report.html",
        {
            "request": request,
            "branches": branches,
            "semesters": semesters,
            "report_data": report_data,
            "selected_branch": int(branch_id) if branch_id else None,
            "selected_semester": int(semester_id) if semester_id else None,
            "title": "Attendance Report",
        },
    )
'''

# Feature F: Bulk Result Status Update
bulk_result_route = '''

# ==================== BULK RESULT STATUS ====================

@router.post("/results/bulk-status")
def bulk_result_status(request: Request, db: Session = Depends(get_db), _=Depends(require_perm("results.manage"))):
    branch_id = get_form_value(request, "branch_id")
    semester_id = get_form_value(request, "semester_id")
    action = get_form_value(request, "action")  # publish or coming_soon
    
    if branch_id and semester_id and action:
        new_status = "published" if action == "publish" else "coming_soon"
        
        db.query(models.Result).filter(
            models.Result.branch_id == int(branch_id),
            models.Result.semester_id == int(semester_id)
        ).update({"status": new_status})
        db.commit()
    
    return RedirectResponse("/admin/results", status_code=status.HTTP_303_SEE_OTHER)
'''

# Add all routes to admin.py
admin_content = admin_content + subjects_route + fee_structure_route + id_card_route + attendance_report_route + bulk_result_route

with open('app/routers/admin.py', 'w') as f:
    f.write(admin_content)

print("Admin routes added")

# Update teacher router for subject-based attendance and session loading
with open('app/routers/teacher.py', 'r') as f:
    teacher_content = f.read()

# Add teacher session loading with subject
old_sync = '''def sync_teacher_session(request: Request, profile: models.TeacherProfile):
    """Sync branch_id and semester_id to session"""
    if profile.branch_id:
        request.session["branch_id"] = profile.branch_id
    if profile.semester_id:
        request.session["semester_id"] = profile.semester_id'''

new_sync = '''def sync_teacher_session(request: Request, profile: models.TeacherProfile):
    """Sync branch_id and semester_id to session"""
    if profile.branch_id:
        request.session["branch_id"] = profile.branch_id
    if profile.semester_id:
        request.session["semester_id"] = profile.semester_id
    # Load subject info
    if profile.subject_id:
        request.session["subject_id"] = profile.subject_id
        subject = db.query(models.Subject).filter(models.Subject.id == profile.subject_id).first()
        if subject:
            request.session["subject_name"] = subject.name'''

teacher_content = teacher_content.replace(old_sync, new_sync)

with open('app/routers/teacher.py', 'w') as f:
    f.write(teacher_content)

print("Teacher routes updated")

# Add student notification routes
with open('app/routers/student.py', 'r') as f:
    student_content = f.read()

notification_routes = '''

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
'''

student_content = student_content + notification_routes

with open('app/routers/student.py', 'w') as f:
    f.write(student_content)

print("Student notification routes added")

print("\n=== All Routes Added ===")
