from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.responses import JSONResponse
from ..database import get_db
from ..models import FeeRecord, Expense
from ..permissions import require_permission
from datetime import datetime, date

router = APIRouter(prefix="/api/admin", tags=["analytics"])


@router.get("/net-profit")
def get_net_profit(db: Session = Depends(get_db), _=Depends(lambda r: require_permission(r, "dashboard.view"))):
    """Calculate net profit: total fees paid - total expenses"""
    
    # Sum of all amount_paid from fee_records (only paid fees)
    total_fees = db.query(func.coalesce(func.sum(FeeRecord.amount_paid), 0)).scalar() or 0.0
    
    # Sum of all expenses
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0.0
    
    net_profit = total_fees - total_expenses
    
    return JSONResponse({
        "total_fees": round(total_fees, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2),
        "formatted": f"${net_profit:,.2f}",
        "updated": datetime.utcnow().isoformat() + "Z",
        "color": "text-green-600" if net_profit > 0 else "text-red-600"
    })


@router.get("/finance/summary")
def get_finance_summary(db: Session = Depends(get_db), _=Depends(lambda r: require_permission(r, "finance.view"))):
    """Get financial summary: total income, total expenses, balance, category breakdown, and last 6 months trend."""

    total_income = db.query(func.coalesce(func.sum(FeeRecord.amount_paid), 0)).scalar() or 0.0
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0.0
    balance = total_income - total_expenses

    category_rows = db.query(
        Expense.category,
        func.coalesce(func.sum(Expense.amount), 0).label("amount"),
    ).group_by(Expense.category).all()

    category_breakdown = [
        {"category": category or "Uncategorized", "amount": round(amount, 2)}
        for category, amount in category_rows
    ]

    today = date.today()
    month_labels = []
    year = today.year
    month = today.month
    for _ in range(6):
        month_labels.insert(0, f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1

    oldest_year, oldest_month = map(int, month_labels[0].split("-"))
    oldest_date = date(oldest_year, oldest_month, 1)

    monthly_data = {label: {"income": 0.0, "expenses": 0.0} for label in month_labels}

    fee_records = db.query(
        FeeRecord.amount_paid,
        FeeRecord.paid_at,
        FeeRecord.created_at,
    ).filter(
        FeeRecord.amount_paid > 0,
        FeeRecord.created_at >= oldest_date,
    ).all()

    for amount_paid, paid_at, created_at in fee_records:
        record_date = (paid_at or created_at).date()
        month_key = record_date.strftime("%Y-%m")
        if month_key in monthly_data:
            monthly_data[month_key]["income"] += float(amount_paid or 0.0)

    expense_records = db.query(
        Expense.amount,
        Expense.expense_date,
    ).filter(
        Expense.expense_date >= oldest_date,
    ).all()

    for amount, expense_date in expense_records:
        month_key = expense_date.strftime("%Y-%m")
        if month_key in monthly_data:
            monthly_data[month_key]["expenses"] += float(amount or 0.0)

    monthly_trend = [
        {
            "month": key,
            "income": round(data["income"], 2),
            "expenses": round(data["expenses"], 2),
        }
        for key, data in monthly_data.items()
    ]

    return JSONResponse({
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "balance": round(balance, 2),
        "category_breakdown": category_breakdown,
        "monthly_trend": monthly_trend,
    })

