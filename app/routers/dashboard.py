from __future__ import annotations

from datetime import date, datetime, timedelta
from collections import defaultdict
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models


def _month_key(dt: datetime | date) -> str:
    if isinstance(dt, date) and not isinstance(dt, datetime):
        dt = datetime.combine(dt, datetime.min.time())
    return dt.strftime("%Y-%m")


def enrollment_trend_last_12_months(db: Session) -> list[dict]:
    try:
        today = date.today()
        start = (today.replace(day=1) - timedelta(days=365))
        dialect = db.bind.dialect.name if db.bind else "sqlite"

        if dialect == "sqlite":
            month_expr = func.strftime("%Y-%m", models.Enrollment.created_at)
        else:
            month_expr = func.to_char(func.date_trunc("month", models.Enrollment.created_at), "YYYY-MM")

        rows = (
            db.query(month_expr.label("month"), func.count(models.Enrollment.id))
            .filter(models.Enrollment.created_at >= start)
            .group_by("month")
            .order_by("month")
            .all()
        )
        counts = {month: count for month, count in rows}
    except Exception:
        counts = {}
        today = date.today()

    months = []
    current = today.replace(day=1)
    for _ in range(12):
        months.append(current)
        current = (current - timedelta(days=1)).replace(day=1)
    months.reverse()

    trend = []
    for m in months:
        key = m.strftime("%Y-%m")
        trend.append({"month": key, "count": counts.get(key, 0)})
    return trend


def absent_streak_alerts(db: Session, min_streak: int = 3) -> list[dict]:
    try:
        today = date.today()
        start = today - timedelta(days=10)
        rows = (
            db.query(models.Attendance)
            .join(models.Enrollment, models.Enrollment.id == models.Attendance.enrollment_id)
            .join(models.StudentProfile, models.StudentProfile.id == models.Enrollment.student_id)
            .join(models.User, models.User.id == models.StudentProfile.user_id)
            .filter(models.Attendance.date >= start, models.Attendance.date <= today)
            .order_by(models.StudentProfile.id.asc(), models.Attendance.date.desc())
            .all()
        )
    except Exception:
        return []
    grouped: dict[int, list[models.Attendance]] = defaultdict(list)
    for row in rows:
        grouped[row.enrollment.student_id].append(row)

    alerts = []
    for student_id, items in grouped.items():
        streak = 0
        last_date = None
        for row in items:
            if row.status != "absent":
                break
            if last_date is None:
                streak = 1
                last_date = row.date
                continue
            if (last_date - row.date).days in {0, 1}:
                streak += 1
                last_date = row.date
            else:
                break
        if streak >= min_streak:
            student = (
                db.query(models.StudentProfile)
                .join(models.User, models.User.id == models.StudentProfile.user_id)
                .filter(models.StudentProfile.id == student_id)
                .first()
            )
            if student:
                alerts.append(
                    {
                        "title": f"{student.user.name} absent {streak} days",
                        "detail": "Attendance streak requires follow-up.",
                        "href": "/admin/attendance",
                        "type": "danger",
                    }
                )
    return alerts


def homepage_alerts(db: Session) -> list[dict]:
    today = date.today()
    alerts: list[dict] = []

    try:
        overdue = (
            db.query(models.FeeRecord)
            .filter(models.FeeRecord.status != "paid", models.FeeRecord.due_date < today)
            .order_by(models.FeeRecord.due_date.asc())
            .limit(5)
            .all()
        )
        for fee in overdue:
            outstanding = max(0.0, fee.amount_due - fee.amount_paid)
            alerts.append(
                {
                    "title": f"Overdue fee: {fee.student.user.name}",
                    "detail": f"₹{outstanding:,.0f} was due on {fee.due_date.isoformat()}",
                    "href": "/admin/fees",
                    "type": "danger",
                }
            )
    except Exception:
        pass

    alerts.extend(absent_streak_alerts(db))

    try:
        upcoming = (
            db.query(models.Assessment)
            .filter(models.Assessment.date >= today, models.Assessment.date <= today + timedelta(days=7))
            .order_by(models.Assessment.date.asc())
            .limit(5)
            .all()
        )
        for row in upcoming:
            alerts.append(
                {
                    "title": f"Assessment: {row.title}",
                    "detail": f"{row.course.title} on {row.date.isoformat()}",
                    "href": "/admin/grades",
                    "type": "info",
                }
            )
    except Exception:
        pass

    return alerts


def today_snapshot(db: Session) -> dict:
    today = date.today()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    present_today = 0
    fees_today = 0.0
    assessments_week = 0
    open_cases = 0

    try:
        present_today = (
            db.query(models.Attendance)
            .filter(models.Attendance.date == today, models.Attendance.status == "present")
            .count()
        )
    except Exception:
        present_today = 0

    try:
        fees_today = (
            db.query(func.coalesce(func.sum(models.FeeRecord.amount_paid), 0.0))
            .filter(models.FeeRecord.paid_at >= start, models.FeeRecord.paid_at <= end)
            .scalar()
        )
    except Exception:
        fees_today = 0.0

    try:
        assessments_week = (
            db.query(models.Assessment)
            .filter(models.Assessment.date >= today, models.Assessment.date <= today + timedelta(days=7))
            .count()
        )
    except Exception:
        assessments_week = 0

    try:
        open_cases = db.query(models.Intervention).filter(models.Intervention.resolved == "no").count()
    except Exception:
        open_cases = 0

    return {
        "present_today": present_today,
        "fees_today": float(fees_today or 0.0),
        "assessments_week": assessments_week,
        "open_cases": open_cases,
    }


def recent_activity_feed(db: Session) -> list[dict]:
    items = []

    try:
        for row in db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).limit(5).all():
            items.append(
                {
                    "title": f"Announcement: {row.title}",
                    "time": row.created_at,
                    "href": "/admin/announcements",
                }
            )
    except Exception:
        pass

    try:
        for row in db.query(models.Intervention).order_by(models.Intervention.created_at.desc()).limit(5).all():
            items.append(
                {
                    "title": f"Risk case created (score {row.risk_score})",
                    "time": row.created_at,
                    "href": "/admin/interventions",
                }
            )
    except Exception:
        pass

    try:
        for row in db.query(models.Attendance).order_by(models.Attendance.date.desc()).limit(5).all():
            items.append(
                {
                    "title": "Attendance marked",
                    "time": datetime.combine(row.date, datetime.min.time()),
                    "href": "/admin/attendance",
                }
            )
    except Exception:
        pass

    try:
        for row in db.query(models.FeeRecord).order_by(models.FeeRecord.created_at.desc()).limit(5).all():
            time_val = row.paid_at or row.created_at
            items.append(
                {
                    "title": "Fee record updated",
                    "time": time_val,
                    "href": "/admin/fees",
                }
            )
    except Exception:
        pass

    try:
        for row in db.query(models.Assessment).order_by(models.Assessment.created_at.desc()).limit(5).all():
            items.append(
                {
                    "title": f"Assessment scheduled: {row.title}",
                    "time": row.created_at,
                    "href": "/admin/grades",
                }
            )
    except Exception:
        pass

    items.sort(key=lambda x: x["time"], reverse=True)
    trimmed = items[:10]
    for item in trimmed:
        item["time_label"] = item["time"].strftime("%b %d, %I:%M %p")
    return trimmed
