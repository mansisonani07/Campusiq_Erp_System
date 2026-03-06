from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StudentProfile, Course, User

router = APIRouter()


@router.get("/search")
def global_search(request: Request, q: str = "", db: Session = Depends(get_db)):
    query = q.strip()
    if not query:
        return request.app.state.templates.TemplateResponse(
            "partials/search_results.html",
            {"request": request, "students": [], "courses": [], "staff": [], "query": query},
        )

    like = f"%{query}%"
    students = (
        db.query(StudentProfile)
        .join(User, User.id == StudentProfile.user_id)
        .filter(or_(User.name.ilike(like), StudentProfile.roll_no.ilike(like), cast(StudentProfile.id, String).ilike(like)))
        .limit(5)
        .all()
    )
    courses = (
        db.query(Course)
        .filter(or_(Course.title.ilike(like), Course.code.ilike(like)))
        .limit(5)
        .all()
    )
    staff = (
        db.query(User)
        .filter(User.role.in_(["admin", "teacher", "accountant", "counselor"]), User.name.ilike(like))
        .limit(5)
        .all()
    )

    return request.app.state.templates.TemplateResponse(
        "partials/search_results.html",
        {"request": request, "students": students, "courses": courses, "staff": staff, "query": query},
    )
