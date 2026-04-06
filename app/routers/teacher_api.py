from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/teacher", tags=["teacher"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/classes")
def classes(request: Request, db: Session = Depends(get_db)):
    """Teacher classes page - professional ERP UI"""
    if request.session.get("role") != "teacher":
        raise HTTPException(403, "Teacher access only")
    
    user_id = request.session.get("user_id")
    profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(403, "Teacher profile not found")
    
    # Get teacher's classes (branch/semester groups)
    classes_data = db.execute("""
        SELECT DISTINCT b.name as branch_name, s.semester_number, 
               COUNT(DISTINCT sp.id) as student_count
        FROM student_profiles sp
        JOIN branches b ON sp.branch_id = b.id
        JOIN semesters s ON sp.semester_id = s.id
        WHERE sp.branch_id = :branch_id AND sp.semester_id = :semester_id
        GROUP BY b.id, b.name, s.semester_number
    """, {"branch_id": profile.branch_id, "semester_id": profile.semester_id}).fetchall()
    
    classes_list = [{"branch": r.branch_name, "semester": r.semester_number, "students": r.student_count} for r in classes_data]
    
    return templates.TemplateResponse("teacher/classes.html", {
        "request": request, 
        "classes": classes_list,
        "user": request.state.current_user if hasattr(request.state, 'current_user') else None,
        "profile": profile
    })

@router.get("/resources")
def resources(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).first()
    
    materials = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.branch_id == profile.branch_id,
        models.StudyMaterial.semester_id == profile.semester_id
    ).order_by(models.StudyMaterial.created_at.desc()).all()
    
    return templates.TemplateResponse("teacher/resources.html", {
        "request": request,
        "materials": materials,
        "profile": profile
    })

@router.get("/settings")
def settings(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    profile = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    return templates.TemplateResponse("teacher/settings.html", {
        "request": request,
        "profile": profile,
        "user": user
    })

