import base64
import json
import os
import smtplib
from email.mime.text import MIMEText
from urllib import parse, request


def mask_email(email: str) -> str:
    if "@" not in email:
        return email
    name, domain = email.split("@", 1)
    if len(name) <= 2:
        masked = name[0] + "*"
    else:
        masked = name[:2] + "*" * max(1, len(name) - 2)
    return f"{masked}@{domain}"


def mask_phone(phone: str) -> str:
    phone = (phone or "").strip()
    if len(phone) < 4:
        return "***"
    return "*" * (len(phone) - 4) + phone[-4:]


def send_otp_email(email_to: str, otp_code: str) -> tuple[bool, str]:
    provider = os.getenv("EMAIL_PROVIDER", "smtp").lower()
    fallback_console = os.getenv("EMAIL_FALLBACK_CONSOLE", "true").lower() == "true"
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM", smtp_user)
    app_name = os.getenv("APP_NAME", "CampusIQ")

    if provider == "console":
        print(f"[DEV-EMAIL] To {email_to} | OTP: {otp_code}")
        return True, "OTP sent to email (console provider)."

    if not smtp_user or not smtp_password or not sender:
        if fallback_console:
            print(f"[DEV-EMAIL] To {email_to} | OTP: {otp_code}")
            return True, "SMTP not configured. OTP printed to console."
        return False, "SMTP credentials are not configured."

    subject = f"{app_name} Login OTP"
    body = (
        f"Your OTP for login is: {otp_code}\n"
        f"This code expires in 5 minutes.\n\n"
        "If you did not request this, ignore this email."
    )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = email_to

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender, [email_to], msg.as_string())
        return True, "OTP sent to email."
    except Exception as exc:
        if fallback_console:
            print(f"[DEV-EMAIL] To {email_to} | OTP: {otp_code}")
            return True, f"SMTP failed, fallback console used: {exc}"
        return False, f"Email send failed: {exc}"


def _send_twilio_sms(phone_to: str, message: str) -> tuple[bool, str]:
    sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_phone = os.getenv("TWILIO_FROM_PHONE", "")

    if not sid or not token or not from_phone:
        return False, "Twilio credentials are not configured."

    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    data = parse.urlencode({"From": from_phone, "To": phone_to, "Body": message}).encode("utf-8")
    req = request.Request(url, data=data, method="POST")
    basic = base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("utf-8")
    req.add_header("Authorization", f"Basic {basic}")

    try:
        with request.urlopen(req, timeout=15) as res:
            payload = json.loads(res.read().decode("utf-8"))
        if payload.get("sid"):
            return True, "OTP sent to phone."
        return False, "SMS provider did not return a message id."
    except Exception as exc:
        return False, f"SMS send failed: {exc}"


def _send_custom_sms(phone_to: str, message: str) -> tuple[bool, str]:
    url = os.getenv("CUSTOM_SMS_API_URL", "").strip()
    api_key = os.getenv("CUSTOM_SMS_API_KEY", "").strip()
    timeout = int(os.getenv("CUSTOM_SMS_API_TIMEOUT_SECONDS", "15"))

    if not url:
        return False, "CUSTOM_SMS_API_URL is not configured."

    payload = {
        "to": phone_to,
        "message": message,
        "source": "nova-student-erp",
    }
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")

    try:
        with request.urlopen(req, timeout=timeout) as res:
            status_code = getattr(res, "status", 200)
            raw = res.read().decode("utf-8", errors="ignore")
        if status_code >= 400:
            return False, f"Custom SMS API returned HTTP {status_code}."

        # Flexible success contract: accept {"ok": true}, {"success": true}, or empty body/2xx.
        if raw.strip():
            try:
                parsed = json.loads(raw)
                ok = bool(parsed.get("ok", parsed.get("success", True)))
                msg = str(parsed.get("message", "OTP sent to phone (custom API)."))
                return (ok, msg) if ok else (False, msg)
            except Exception:
                return True, "OTP sent to phone (custom API)."
        return True, "OTP sent to phone (custom API)."
    except Exception as exc:
        return False, f"Custom SMS API send failed: {exc}"


def _send_textbelt_sms(phone_to: str, message: str) -> tuple[bool, str]:
    api_key = os.getenv("TEXTBELT_API_KEY", "textbelt").strip() or "textbelt"
    url = os.getenv("TEXTBELT_API_URL", "https://textbelt.com/text").strip() or "https://textbelt.com/text"

    data = parse.urlencode({"phone": phone_to, "message": message, "key": api_key}).encode("utf-8")
    req = request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("Accept", "application/json")

    try:
        with request.urlopen(req, timeout=15) as res:
            raw = res.read().decode("utf-8", errors="ignore")
            payload = json.loads(raw) if raw.strip() else {}
        ok = bool(payload.get("success"))
        if ok:
            quota = payload.get("quotaRemaining")
            quota_msg = f" Quota remaining: {quota}." if quota is not None else ""
            return True, f"OTP sent via Textbelt.{quota_msg}"
        err = payload.get("error", "Textbelt rejected the SMS request.")
        return False, f"Textbelt send failed: {err}"
    except Exception as exc:
        return False, f"Textbelt SMS send failed: {exc}"


def send_otp_sms(phone_to: str, otp_code: str) -> tuple[bool, str]:
    provider = os.getenv("SMS_PROVIDER", "console").lower()
    app_name = os.getenv("APP_NAME", "CampusIQ")
    message = f"{app_name} OTP: {otp_code}. Expires in 5 minutes."

    if provider == "twilio":
        return _send_twilio_sms(phone_to, message)
    if provider == "custom_api":
        return _send_custom_sms(phone_to, message)
    if provider == "textbelt":
        return _send_textbelt_sms(phone_to, message)

    print(f"[DEV-SMS] To {phone_to} | {message}")
    return True, "OTP sent to phone (console provider)."


def send_alert_email(email_to: str, subject: str, body: str) -> tuple[bool, str]:
    provider = os.getenv("EMAIL_PROVIDER", "smtp").lower()
    fallback_console = os.getenv("EMAIL_FALLBACK_CONSOLE", "true").lower() == "true"
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM", smtp_user)

    if provider == "console":
        print(f"[DEV-EMAIL] To {email_to} | {subject} | {body}")
        return True, "Alert sent (console provider)."

    if not smtp_user or not smtp_password or not sender:
        if fallback_console:
            print(f"[DEV-EMAIL] To {email_to} | {subject} | {body}")
            return True, "SMTP not configured. Alert printed to console."
        return False, "SMTP credentials are not configured."

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = email_to

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender, [email_to], msg.as_string())
        return True, "Alert sent to email."
    except Exception as exc:
        if fallback_console:
            print(f"[DEV-EMAIL] To {email_to} | {subject} | {body}")
            return True, f"SMTP failed, fallback console used: {exc}"
        return False, f"Email alert failed: {exc}"


def send_alert_sms(phone_to: str, text: str) -> tuple[bool, str]:
    provider = os.getenv("SMS_PROVIDER", "console").lower()
    if provider == "twilio":
        return _send_twilio_sms(phone_to, text)
    if provider == "custom_api":
        return _send_custom_sms(phone_to, text)
    if provider == "textbelt":
        return _send_textbelt_sms(phone_to, text)
    print(f"[DEV-SMS] To {phone_to} | {text}")
    return True, "Alert sent to phone (console provider)."
