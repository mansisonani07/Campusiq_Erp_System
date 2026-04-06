from datetime import datetime
import hashlib
import logging
import os
import re
import secrets
import sys
from pathlib import Path

from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from .models import User, StudentProfile, LoginOTP, KnownDevice, DeviceApprovalToken
from .notifications import (
    send_otp_email,
    send_otp_sms,
    send_alert_email,
    send_alert_sms,
    mask_email,
    mask_phone,
)
from .otp import generate_otp, hash_otp, otp_expiry


EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
PASSWORD_STRONG_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$")
otp_logger = logging.getLogger("uvicorn.error")


def request_env(key: str) -> str:
    return os.getenv(key, "").strip()


def emit_dev_otp(message: str) -> None:
    import sys
    border = "=" * 60
    output = "\n" + border + "\n  *** DEV MODE OTP ***\n  " + message + "\n" + border + "\n\n"
    # Write to stderr - uvicorn always shows this
    sys.stderr.write(output)
    sys.stderr.flush()
    # Also use print with force flush
    print(output, flush=True)
    # Use logging which uvicorn captures
    otp_logger.info("OTP: " + message)
    # Also write to file
    try:
        with open("otp_display.txt", "w", encoding="utf-8") as f:
            f.write(border + "\n*** DEV MODE OTP ***\n" + message + "\n" + border + "\n")
    except Exception:
        pass


def env_flag(key: str, default: bool = False) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def normalize_login_role(login_as: str) -> str:
    raw = (login_as or "").strip().lower()
    aliases = {
        "student": "student",
        "students": "student",
        "teacher": "teacher",
        "teachers": "teacher",
        "techer": "teacher",
        "admin": "admin",
        "aadmin": "admin",
        "administrator": "admin",
    }
    return aliases.get(raw, raw)


def role_matches_login_category(user_role: str, login_as: str) -> bool:
    user_role = (user_role or "").strip().lower()
    if login_as == "student":
        return user_role == "student"
    if login_as == "teacher":
        return user_role == "teacher"
    if login_as == "admin":
        return user_role in {"admin", "accountant", "counselor"}
    return False


def normalize_phone(raw: str) -> str:
    return "".join(ch for ch in raw if ch.isdigit())


def valid_email(value: str) -> bool:
    return bool(EMAIL_RE.fullmatch(value.strip()))


def valid_phone(value: str) -> bool:
    digits = normalize_phone(value)
    return 10 <= len(digits) <= 15


def valid_strong_password(password: str) -> bool:
    return bool(PASSWORD_STRONG_RE.fullmatch(password))


def resolve_user_phone(db: Session, user: User) -> str | None:
    user_role = (user.role or "").strip().lower()
    if user_role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        return profile.phone if profile and profile.phone else None
    role_phone_env = {
        "admin": "ADMIN_PHONE",
        "teacher": "TEACHER_PHONE",
        "accountant": "ACCOUNTANT_PHONE",
        "counselor": "COUNSELOR_PHONE",
    }
    key = role_phone_env.get(user_role, "")
    phone = request_env(key) if key else ""
    return phone or None


def find_user_by_identifier(db: Session, identifier_type: str, identifier: str) -> User | None:
    if identifier_type == "email":
        return db.query(User).filter(User.email == identifier.lower()).first()

    if identifier_type == "phone":
        normalized = normalize_phone(identifier)
        profiles = db.query(StudentProfile).all()
        for profile in profiles:
            if normalize_phone(profile.phone or "") == normalized:
                return db.query(User).filter(User.id == profile.user_id).first()

        for role, env_key in {
            "admin": "ADMIN_PHONE",
            "teacher": "TEACHER_PHONE",
            "accountant": "ACCOUNTANT_PHONE",
            "counselor": "COUNSELOR_PHONE",
        }.items():
            if normalize_phone(request_env(env_key) or "") == normalized:
                return db.query(User).filter(func.lower(User.role) == role).first()
    return None


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "0.0.0.0"


def get_device_name(request: Request) -> str:
    ua = request.headers.get("user-agent", "unknown-device")
    return ua[:240]


def get_device_hash(request: Request) -> str:
    ua = request.headers.get("user-agent", "unknown-device")
    ip = get_client_ip(request)
    payload = (ua + "|" + ip).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def email_exists_for_other_user(db: Session, email: str, user_id: int) -> bool:
    row = db.query(User).filter(User.email == email.lower(), User.id != user_id).first()
    return row is not None


def phone_exists_for_other_student(db: Session, phone: str, user_id: int) -> bool:
    target = normalize_phone(phone)
    profiles = db.query(StudentProfile).all()
    for profile in profiles:
        if profile.user_id != user_id and normalize_phone(profile.phone or "") == target:
            return True
    return False


def send_login_otp(db: Session, user: User) -> tuple[bool, str, str, str, str]:
    code = generate_otp()
    phone = resolve_user_phone(db, user)
    dev_otp = code
    # Emit OTP to console and file AFTER dev_otp is set
    emit_dev_otp("[DEV-OTP] User " + user.email + " | OTP: " + code)

    # Invalidate previously active OTPs so only the newest code is accepted.
    active_rows = (
        db.query(LoginOTP)
        .filter(LoginOTP.user_id == user.id, LoginOTP.consumed_at.is_(None))
        .all()
    )
    for old in active_rows:
        old.consumed_at = datetime.utcnow()
    if active_rows:
        db.commit()

    row = LoginOTP(
        user_id=user.id,
        otp_hash=hash_otp(code),
        expires_at=otp_expiry(5),
        consumed_at=None,
        attempt_count=0,
        email_sent="no",
        sms_sent="no",
    )
    db.add(row)
    db.commit()

    email_ok, email_msg = send_otp_email(user.email, code)
    sms_provider = request_env("SMS_PROVIDER").lower() or "console"
    fallback_phone = request_env("DEV_FALLBACK_PHONE")
    sms_target = phone or fallback_phone

    if not sms_target and sms_provider == "console":
        sms_target = "not-configured"

    if not sms_target:
        sms_ok, sms_msg = False, "Phone number is not configured for this account."
    else:
        sms_ok, sms_msg = send_otp_sms(sms_target, code)
        if not phone and sms_ok:
            sms_msg = sms_msg + " (using terminal fallback target)"
    row.email_sent = "yes" if email_ok else "no"
    row.sms_sent = "yes" if sms_ok else "no"
    db.commit()
    masked_email = mask_email(user.email)
    masked_phone = mask_phone(phone) if phone else "not configured"
    # Return code as dev_otp so it displays in terminal
    if email_ok and sms_ok:
        return True, "OTP sent to registered email and phone.", masked_email, masked_phone, code
    if not email_ok and not sms_ok:
        return False, "Email OTP failed: " + email_msg + " | SMS OTP failed: " + sms_msg, masked_email, masked_phone, code
    if email_ok:
        return True, "OTP sent to email only. SMS unavailable: " + sms_msg, masked_email, masked_phone, code
    return True, "OTP sent to phone only. Email unavailable: " + email_msg, masked_email, masked_phone, code


def parse_pending_login_meta(meta: str | None) -> tuple[str, bool]:
    if not meta or "|" not in meta:
        return "student", False
    parts = meta.split("|")
    role = parts[0] if len(parts) > 0 else "student"
    remember = len(parts) > 1 and parts[1] == "yes"
    return role, remember


def ensure_device_approved_or_send_request(db: Session, request: Request, user: User) -> tuple[bool, str]:
    if not env_flag("NEW_DEVICE_APPROVAL_REQUIRED", default=True):
        return True, "Device approval disabled by configuration."

    device_hash = get_device_hash(request)
    device_name = get_device_name(request)
    base_url = str(request.base_url).rstrip("/")

    known = db.query(KnownDevice).filter(KnownDevice.user_id == user.id, KnownDevice.device_hash == device_hash).first()
    if known and known.approved == "yes":
        known.last_seen_at = datetime.utcnow()
        db.commit()
        return True, "Device recognized."

    any_known = db.query(KnownDevice).filter(KnownDevice.user_id == user.id, KnownDevice.approved == "yes").first()
    if not any_known:
        db.add(
            KnownDevice(
                user_id=user.id,
                device_hash=device_hash,
                device_name=device_name,
                approved="yes",
                last_seen_at=datetime.utcnow(),
            )
        )
        db.commit()
        return True, "First device auto-approved."

    raw_token = secrets.token_urlsafe(24)
    token_hash = hash_otp(raw_token)
    db.add(
        DeviceApprovalToken(
            user_id=user.id,
            device_hash=device_hash,
            device_name=device_name,
            token_hash=token_hash,
            expires_at=otp_expiry(15),
        )
    )
    db.commit()

    approve_url = base_url + "/approve-device?token=" + raw_token
    subject = "New Device Login Attempt - Approval Required"
    body = (
        "We detected a login attempt from a new device.\n\n"
        "Device: " + device_name + "\nIP: " + get_client_ip(request) + "\n"
        "Approve this device: " + approve_url + "\n\n"
        "If this was not you, ignore this email."
    )
    send_alert_email(user.email, subject, body)
    phone = resolve_user_phone(db, user)
    if phone:
        send_alert_sms(phone, "New device login detected. Check your email to approve device.")
    return False, "New device approval required. Approval link sent to email."

