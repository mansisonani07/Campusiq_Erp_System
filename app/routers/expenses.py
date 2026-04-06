from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import Expense, User, AuditLog
from ..permissions import require_permission
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


def log_action(db: Session, request, action: str, details: str = ""):
    """Local logging function to avoid circular imports - just print for now"""
    print(f"AUDIT: {action} - {details}")


class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str = "General"
    expense_date: date = date.today()


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    expense_date: Optional[date] = None


CATEGORIES = ["Salary", "Utilities", "Supplies", "Maintenance", "Other"]


@router.post("/")
def create_expense(
    expense_in: ExpenseCreate,
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(lambda r: require_permission(r, "expenses.manage"))  # Admin only
):
    if expense_in.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of {CATEGORIES}")
    
    expense = Expense(**expense_in.dict(), created_by=request.session.get("user_id"))
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    log_action(db, request, "Expense Created", f"Created expense: {expense.description} (${expense.amount})")
    
    return JSONResponse(
        status_code=201,
        content={"message": "Expense created", "expense": jsonable_encoder(expense)}
    )


@router.get("/")
def list_expenses(
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(lambda r: require_permission(r, "expenses.view"))  # Admin + Analyst
):
    query = db.query(Expense).order_by(Expense.created_at.desc())
    
    if category and category in CATEGORIES:
        query = query.filter(Expense.category == category)
    
    total = query.count()
    expenses = query.offset(skip).limit(limit).all()
    
    return JSONResponse({
        "expenses": [jsonable_encoder(e) for e in expenses],
        "total": total,
        "skip": skip,
        "limit": limit,
        "categories": CATEGORIES
    })


@router.put("/{expense_id}")
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(lambda r: require_permission(r, "expenses.manage"))  # Admin only
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense_in.dict(exclude_unset=True)
    if "category" in update_data and update_data["category"] not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of {CATEGORIES}")
    
    for field, value in update_data.items():
        setattr(expense, field, value)
    
    db.commit()
    db.refresh(expense)
    
    log_action(db, request, "Expense Updated", f"Updated expense {expense_id}: {expense.description}")
    
    return JSONResponse({"message": "Expense updated", "expense": jsonable_encoder(expense)})


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(lambda r: require_permission(r, "expenses.manage"))  # Admin only
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    description = expense.description
    db.delete(expense)
    db.commit()
    
    log_action(db, request, "Expense Deleted", f"Deleted expense: {description}")
    
    return JSONResponse({"message": "Expense deleted"})


