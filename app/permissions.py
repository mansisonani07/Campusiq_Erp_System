from fastapi import HTTPException, Request


ROLE_PERMISSIONS = {
    "admin": {"*"},
    "analyst": {
        "dashboard.view",
        "finance.view",
        "expenses.view",
        "analytics.view",
    },
    "viewer": {
        "dashboard.view",
    },
    "teacher": {
        "dashboard.view",
        "students.view",
        "students.manage",
        "courses.view",
        "courses.manage",
        "enrollments.view",
        "enrollments.manage",
        "attendance.view",
        "attendance.manage",
        "grades.view",
        "grades.manage",
        "announcements.view",
        "announcements.manage",
        "interventions.view",
        "transport.view",
        "hostel.view",
    },
    "accountant": {
        "dashboard.view",
        "students.view",
        "fees.view",
        "fees.manage",
        "announcements.view",
        "transport.view",
        "hostel.view",
    },
    "counselor": {
        "dashboard.view",
        "students.view",
        "attendance.view",
        "grades.view",
        "fees.view",
        "interventions.view",
        "interventions.manage",
        "announcements.view",
    },
    "student": {
        "student.dashboard.view",
    },
}


def has_permission(role: str | None, permission: str) -> bool:
    if not role:
        return False
    allowed = ROLE_PERMISSIONS.get(role, set())
    return "*" in allowed or permission in allowed


def require_permission(request: Request, permission: str) -> None:
    role = request.session.get("role")
    if not has_permission(role, permission):
        raise HTTPException(status_code=403, detail="You do not have permission for this action.")
