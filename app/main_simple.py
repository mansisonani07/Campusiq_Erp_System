from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import RedirectResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os
from urllib.parse import parse_qs

from app.database import Base, engine, SessionLocal
from app.routers import public, admin, student, teacher, search
from app.models import User, StudentProfile, Course, Enrollment, Attendance, Grade, FeeRecord, Announcement, SiteSetting, Assessment
from app.auth import hash_password
from app.permissions import has_permission
from app.session import (
    get_session_user_id,
    session_expired,
    touch_user_session,
    clear_user_session,
    get_or_create_csrf_token,
    validate_csrf_token,
    session_age_minutes,
)
from sqlalchemy import inspect, text

load_dotenv()

app = FastAPI(title="Student ERP System", version="1.0.0")
SESSION_IDLE_TIMEOUT_MINUTES = int(os.getenv("SESSION_IDLE_TIMEOUT_MINUTES", "120"))
REMEMBER_IDLE_TIMEOUT_MINUTES = int(os.getenv("REMEMBER_IDLE_TIMEOUT_MINUTES", "10080"))
NON_REMEMBER_MAX_AGE_MINUTES = int(os.getenv("NON_REMEMBER_MAX_AGE_MINUTES", "720"))
REMEMBER_MAX_AGE_MINUTES = int(os.getenv("REMEMBER_MAX_AGE_MINUTES", "43200"))
COOKIE_MAX_AGE_SECONDS = int(os.getenv("COOKIE_MAX_AGE_SECONDS", "86400"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAME_SITE = os.getenv("COOKIE_SAME_SITE", "lax")
COOKIE_NAME = os.getenv("COOKIE_NAME", "student_erp_session")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.state.templates = Jinja2Templates(directory="app/templates")
app.state.templates.env.globals["has_permission"] = has_permission


def template_csrf_token(request: Request) -> str:
    return get_or_create_csrf_token(request)


app.state.templates.env.globals["csrf_token"] = template_csrf_token


from starlette.middleware.base import BaseHTTPMiddleware


class SessionGuardMiddleware(BaseHTTPMiddleware):
    # Routes that don't require CSRF validation
    CSRF_EXEMPT_ROUTES = {"/login-simple", "/login", "/register", "/forgot-password", "/reset-password", "/verify-otp", "/approve-device", "/auth/google/start"}
    
    def _is_csrf_exempt(self, path: str) -> bool:
        # Check exact match or prefix match for public API routes
        if path in self.CSRF_EXEMPT_ROUTES:
            return True
        # Also exempt if path starts with these public routes
        for exempt_path in self.CSRF_EXEMPT_ROUTES:
            if path.startswith(exempt_path):
                return True
        return False

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        protected = path.startswith("/admin") or path.startswith("/student") or path.startswith("/teacher")
        is_static = path.startswith("/static")
        csrf_exempt = self._is_csrf_exempt(path)
        get_or_create_csrf_token(request)

        # Always parse form data for POST requests so route handlers can access it
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and not is_static:
            content_type = request.headers.get("content-type", "")
            if "application/x-www-form-urlencoded" in content_type:
                body_text = (await request.body()).decode("utf-8", errors="ignore")
                # Re-create the body stream so downstream handlers can read it
                async def receive():
                    return {"type": "http.request", "body": body_text.encode("utf-8")}
                request._receive = receive
                parsed = parse_qs(body_text)
                # Store parsed form data in request.state for route handlers
                request.state.form = parsed
                
                # Only validate CSRF for non-exempt routes
                if not csrf_exempt:
                    submitted_token = request.headers.get("X-CSRF-Token")
                    token_values = parsed.get("csrf_token", [])
                    submitted_token = token_values[0] if token_values else None
                    if not validate_csrf_token(request.session, submitted_token):
                        return PlainTextResponse("CSRF validation failed", status_code=403)

        user_id = get_session_user_id(request.session)

        if user_id:
            remember_me = request.session.get("remember_me") == "yes"
            max_age_minutes = REMEMBER_MAX_AGE_MINUTES if remember_me else NON_REMEMBER_MAX_AGE_MINUTES
            current_age = session_age_minutes(request.session)
            if current_age is None or current_age > max_age_minutes:
                clear_user_session(request)
                if protected:
                    return RedirectResponse("/login", status_code=303)
                return await call_next(request)

            effective_idle_timeout = REMEMBER_IDLE_TIMEOUT_MINUTES if remember_me else SESSION_IDLE_TIMEOUT_MINUTES
            if session_expired(request.session, effective_idle_timeout):
                clear_user_session(request)
                if protected:
                    return RedirectResponse("/login", status_code=303)
            else:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                finally:
                    db.close()
                if not user:
                    clear_user_session(request)
                    if protected:
                        return RedirectResponse("/login", status_code=303)
                else:
                    request.state.current_user = user
                    user_role = (user.role or "").strip().lower()
                    request.state.current_role = user_role
                    request.session["role"] = user_role
                    if path.startswith("/student") and user_role != "student":
                        return RedirectResponse("/login?msg=Access denied for student portal.", status_code=303)
                    if path.startswith("/teacher") and user_role != "teacher":
                        return RedirectResponse("/login?msg=Access denied for teacher portal.", status_code=303)
                    if path.startswith("/admin") and user_role not in ["admin", "accountant", "counselor"]:
                        return RedirectResponse("/login?msg=Access denied for admin portal.", status_code=303)
                    touch_user_session(request)

        elif protected:
            return RedirectResponse("/login", status_code=303)

        response = await call_next(request)
        return response


# Note: Middleware order matters! SessionMiddleware must be added first (outermost)
# because Starlette processes middleware in reverse order
app.add_middleware(SessionGuardMiddleware)
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "change-me"), session_cookie=COOKIE_NAME, max_age=COOKIE_MAX_AGE_SECONDS, same_site=COOKIE_SAME_SITE, https_only=COOKIE_SECURE)


@app.on_event("startup")
def startup():
    # Simplified startup - just create tables without complex migrations
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


app.include_router(public.router)
app.include_router(admin.router)
app.include_router(student.router)
app.include_router(teacher.router)
app.include_router(search.router)