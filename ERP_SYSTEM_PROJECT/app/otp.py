from datetime import datetime, timedelta
import hashlib
import hmac
import os
import random


def generate_otp(length: int = 6) -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def otp_expiry(minutes: int = 5) -> datetime:
    return datetime.utcnow() + timedelta(minutes=minutes)


def hash_otp(raw_code: str) -> str:
    secret = os.getenv("OTP_SECRET", os.getenv("SECRET_KEY", "change-me"))
    payload = f"{secret}:{raw_code}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def verify_otp(raw_code: str, hashed_code: str) -> bool:
    return hmac.compare_digest(hash_otp(raw_code), hashed_code)
