from datetime import date, datetime, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models


def attendance_percentage(db: Session, student_id: int) -> float:
    total = (
        db.query(models.Attendance)
        .join(models.Enrollment, models.Enrollment.id == models.Attendance.enrollment_id)
        .filter(models.Enrollment.student_id == student_id)
        .count()
    )
    if total == 0:
        return 0.0
    present = (
        db.query(models.Attendance)
        .join(models.Enrollment, models.Enrollment.id == models.Attendance.enrollment_id)
        .filter(models.Enrollment.student_id == student_id, models.Attendance.status == "present")
        .count()
    )
    return round((present / total) * 100, 2)


def grade_average(db: Session, student_id: int) -> float:
    avg = (
        db.query(func.avg((models.Grade.marks_obtained / models.Grade.max_marks) * 100))
        .join(models.Enrollment, models.Enrollment.id == models.Grade.enrollment_id)
        .filter(models.Enrollment.student_id == student_id)
        .scalar()
    )
    return round(float(avg or 0.0), 2)


def risk_score(db: Session, student_id: int) -> float:
    att = attendance_percentage(db, student_id)
    grade = grade_average(db, student_id)
    
    # Improved risk calculation with balanced weights
    # Attendance: 50% weight, Grades: 50% weight
    # Lower attendance and grades contribute more to risk score
    attendance_risk = max(0.0, 100 - att)  # Inverse of attendance
    grade_risk = max(0.0, 100 - grade)     # Inverse of grade average
    
    # Balanced calculation: 50% attendance risk + 50% grade risk
    risk = (attendance_risk * 0.5) + (grade_risk * 0.5)
    
    # Ensure risk is between 0 and 100
    return round(max(0.0, min(100.0, risk)), 2)


def recommendation_from_risk(score: float) -> str:
    if score >= 70:
        return "Urgent mentor call, guardian meeting, and weekly remediation plan."
    if score >= 45:
        return "Assign study buddy, bi-weekly counseling, and attendance watchlist."
    return "Student is stable. Continue regular academic monitoring."


def _trend(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 2)


def _academic_year_label(today: date) -> str:
    if today.month >= 7:
        start_year = today.year
        end_year = today.year + 1
        semester = "Semester 1"
    else:
        start_year = today.year - 1
        end_year = today.year
        semester = "Semester 2"
    return f"AY {start_year}-{str(end_year)[-2:]}", semester


def dashboard_metrics(db: Session) -> dict:
    today = date.today()
    start_30 = today - timedelta(days=30)
    start_60 = today - timedelta(days=60)

    start_30_dt = datetime.combine(start_30, time.min)
    start_60_dt = datetime.combine(start_60, time.min)
    start_today_dt = datetime.combine(today, time.min)

    attendance_current = (
        db.query(models.Attendance).filter(models.Attendance.date >= start_30, models.Attendance.date <= today).count()
    )
    attendance_previous = (
        db.query(models.Attendance).filter(models.Attendance.date >= start_60, models.Attendance.date < start_30).count()
    )

    announcements_current = (
        db.query(models.Announcement)
        .filter(models.Announcement.created_at >= start_30_dt, models.Announcement.created_at <= datetime.utcnow())
        .count()
    )
    announcements_previous = (
        db.query(models.Announcement)
        .filter(models.Announcement.created_at >= start_60_dt, models.Announcement.created_at < start_30_dt)
        .count()
    )

    interventions_current = (
        db.query(models.Intervention)
        .filter(models.Intervention.created_at >= start_30_dt, models.Intervention.risk_score >= 45)
        .count()
    )
    interventions_previous = (
        db.query(models.Intervention)
        .filter(models.Intervention.created_at >= start_60_dt, models.Intervention.created_at < start_30_dt, models.Intervention.risk_score >= 45)
        .count()
    )

    fee_records = db.query(models.FeeRecord).all()
    total_due = sum(f.amount_due for f in fee_records)
    total_paid = sum(f.amount_paid for f in fee_records)
    pending_amount = sum(max(0.0, f.amount_due - f.amount_paid) for f in fee_records if f.status != "paid")
    collection_rate = round((total_paid / total_due) * 100, 2) if total_due else 0.0

    due_soon_cutoff = today + timedelta(days=7)
    overdue_count = len([f for f in fee_records if f.status != "paid" and f.due_date < today])
    due_soon_count = len([f for f in fee_records if f.status != "paid" and today <= f.due_date <= due_soon_cutoff])
    due_today_count = len([f for f in fee_records if f.status != "paid" and f.due_date == today])

    attendance_today = db.query(models.Attendance).filter(models.Attendance.date == today).count()
    present_today = (
        db.query(models.Attendance)
        .filter(models.Attendance.date == today, models.Attendance.status == "present")
        .count()
    )
    absent_today = (
        db.query(models.Attendance)
        .filter(models.Attendance.date == today, models.Attendance.status != "present")
        .count()
    )
    # Calculate attendance percentage for today
    attendance_today_pct = round((present_today / attendance_today) * 100, 1) if attendance_today > 0 else 0.0
    
    academic_year, semester = _academic_year_label(today)

    pending_fees_count = db.query(models.FeeRecord).filter(models.FeeRecord.status != "paid").count()

    try:
        upcoming_assessments = (
            db.query(models.Assessment)
            .filter(models.Assessment.date >= today, models.Assessment.date <= today + timedelta(days=7))
            .count()
        )
    except Exception:
        upcoming_assessments = 0

    staff_count = db.query(models.User).filter(models.User.role.in_(["admin", "staff"])).count()
    
    # New stats for Phase 3
    total_branches = db.query(models.Branch).count()
    total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
    
    pending_fees_query = db.query(models.FeeRecord).filter(models.FeeRecord.status != "paid")
    pending_fees_amount = sum(max(0.0, f.amount_due - f.amount_paid) for f in pending_fees_query.all())
    pending_fees_count = pending_fees_query.count()
    
    return {
        "students": db.query(models.StudentProfile).count(),
        "courses": db.query(models.Course).count(),
        "staff_count": staff_count,
        "total_branches": total_branches,
        "total_teachers": total_teachers,
        "pending_fees": pending_fees_count,
        "pending_fees_amount": int(pending_fees_amount),
        "attendance_30d": attendance_current,
        "attendance_trend": _trend(attendance_current, attendance_previous),
        "announcements_30d": announcements_current,
        "announcements_trend": _trend(announcements_current, announcements_previous),
        "high_risk_30d": interventions_current,
        "high_risk_trend": _trend(interventions_current, interventions_previous),
        "collection_rate": int(collection_rate),
        "total_due": int(total_due),
        "total_paid": int(total_paid),
        "pending_amount": int(pending_amount),
        "overdue_fees": overdue_count,
        "due_soon_fees": due_soon_count,
        "due_today_fees": due_today_count,
        "attendance_today": attendance_today,
        "present_today": present_today,
        "absent_today": absent_today,
        "attendance_today_pct": int(attendance_today_pct),
        "academic_year": academic_year,
        "semester": semester,
        "upcoming_assessments": upcoming_assessments,
        "action_center": [
            f"{overdue_count} fee records are overdue.",
            f"{due_soon_count} fee records are due within 7 days.",
            f"₹{int(pending_amount):,} pending across {pending_fees_count} fee records.",
            f"{interventions_current} students flagged at medium/high risk in last 30 days.",
        ],
        "generated_at": start_today_dt,
    }


def fee_reminders(db: Session) -> list[dict]:
    today = date.today()
    window = today + timedelta(days=14)
    rows = (
        db.query(models.FeeRecord)
        .join(models.StudentProfile, models.StudentProfile.id == models.FeeRecord.student_id)
        .filter(models.FeeRecord.status != "paid", models.FeeRecord.due_date <= window)
        .order_by(models.FeeRecord.due_date.asc())
        .all()
    )
    reminders = []
    for row in rows:
        outstanding = max(0.0, row.amount_due - row.amount_paid)
        urgency = "overdue" if row.due_date < today else "due_soon"
        reminders.append(
            {
                "fee_id": row.id,
                "student_roll": row.student.roll_no,
                "student_name": row.student.user.name,
                "due_date": row.due_date,
                "outstanding": round(outstanding, 2),
                "urgency": urgency,
            }
        )
    return reminders
