from datetime import datetime, timedelta, timezone
from fastapi import Request
from typing import Any
import secrets
import hmac


SESSION_LAST_SEEN_KEY = "last_seen_at"
SESSION_LOGIN_AT_KEY = "login_at"
SESSION_USER_ID_KEY = "user_id"
SESSION_ROLE_KEY = "role"
SESSION_CSRF_KEY = "csrf_token"
SESSION_REMEMBER_ME_KEY = "remember_me"
SESSION_BRANCH_ID_KEY = "branch_id"
SESSION_SEMESTER_ID_KEY = "semester_id"
SESSION_NAME_KEY = "name"
PENDING_USER_ID_KEY = "pending_user_id"
PENDING_ROLE_KEY = "pending_role"
RESET_PENDING_USER_ID_KEY = "reset_pending_user_id"
RESET_PENDING_CHANNEL_KEY = "reset_pending_channel"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def set_user_session(request: Request, user_id: int, role: str, remember_me: bool = False, 
                      branch_id: int = None, semester_id: int = None, name: str = "") -> None:
    now = utcnow().isoformat()
    normalized_role = (role or "").strip().lower()
    request.session.clear()
    request.session[SESSION_USER_ID_KEY] = user_id
    request.session[SESSION_ROLE_KEY] = normalized_role
    request.session[SESSION_LOGIN_AT_KEY] = now
    request.session[SESSION_LAST_SEEN_KEY] = now
    request.session[SESSION_REMEMBER_ME_KEY] = "yes" if remember_me else "no"
    request.session[SESSION_CSRF_KEY] = secrets.token_urlsafe(24)
    if branch_id:
        request.session[SESSION_BRANCH_ID_KEY] = branch_id
    if semester_id:
        request.session[SESSION_SEMESTER_ID_KEY] = semester_id
    if name:
        request.session[SESSION_NAME_KEY] = name


def clear_user_session(request: Request) -> None:
    request.session.clear()


def set_pending_login_session(request: Request, user_id: int, role: str) -> None:
    request.session[PENDING_USER_ID_KEY] = user_id
    request.session[PENDING_ROLE_KEY] = role


def get_pending_login_session(session: dict[str, Any]) -> tuple[int | None, str | None]:
    user_id = session.get(PENDING_USER_ID_KEY)
    role = session.get(PENDING_ROLE_KEY)
    return (user_id if isinstance(user_id, int) else None, role if isinstance(role, str) else None)


def clear_pending_login_session(request: Request) -> None:
    request.session.pop(PENDING_USER_ID_KEY, None)
    request.session.pop(PENDING_ROLE_KEY, None)


def set_pending_reset_session(request: Request, user_id: int, channel: str) -> None:
    request.session[RESET_PENDING_USER_ID_KEY] = user_id
    request.session[RESET_PENDING_CHANNEL_KEY] = channel


def get_pending_reset_session(session: dict[str, Any]) -> tuple[int | None, str | None]:
    user_id = session.get(RESET_PENDING_USER_ID_KEY)
    channel = session.get(RESET_PENDING_CHANNEL_KEY)
    return (user_id if isinstance(user_id, int) else None, channel if isinstance(channel, str) else None)


def clear_pending_reset_session(request: Request) -> None:
    request.session.pop(RESET_PENDING_USER_ID_KEY, None)
    request.session.pop(RESET_PENDING_CHANNEL_KEY, None)


def touch_user_session(request: Request) -> None:
    request.session[SESSION_LAST_SEEN_KEY] = utcnow().isoformat()


def get_session_user_id(session: dict[str, Any]) -> int | None:
    user_id = session.get(SESSION_USER_ID_KEY)
    if isinstance(user_id, int):
        return user_id
    return None


def session_expired(session: dict[str, Any], idle_minutes: int) -> bool:
    last_seen_raw = session.get(SESSION_LAST_SEEN_KEY)
    if not isinstance(last_seen_raw, str):
        return True
    try:
        last_seen = datetime.fromisoformat(last_seen_raw)
    except ValueError:
        return True
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    return utcnow() - last_seen > timedelta(minutes=idle_minutes)


def get_or_create_csrf_token(request: Request) -> str:
    token = request.session.get(SESSION_CSRF_KEY)
    if isinstance(token, str) and token:
        return token
    token = secrets.token_urlsafe(24)
    request.session[SESSION_CSRF_KEY] = token
    return token


def validate_csrf_token(session: dict[str, Any], submitted: str | None) -> bool:
    expected = session.get(SESSION_CSRF_KEY)
    if not isinstance(expected, str) or not expected:
        return False
    if not isinstance(submitted, str) or not submitted:
        return False
    return hmac.compare_digest(expected, submitted)


def session_age_minutes(session: dict[str, Any]) -> int | None:
    login_raw = session.get(SESSION_LOGIN_AT_KEY)
    if not isinstance(login_raw, str):
        return None
    try:
        login_dt = datetime.fromisoformat(login_raw)
    except ValueError:
        return None
    if login_dt.tzinfo is None:
        login_dt = login_dt.replace(tzinfo=timezone.utc)
    delta = utcnow() - login_dt
    return int(delta.total_seconds() // 60)
