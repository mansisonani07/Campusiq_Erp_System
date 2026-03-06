"""
Form parsing utilities for handling CSRF middleware consuming request body.
The middleware in main.py parses the form data for CSRF validation and stores it in request.state.form.
This module provides helpers to access that parsed data in route handlers.
"""
from fastapi import Request
from typing import Any


def get_form_value(request: Request, key: str, default: str = "") -> str:
    """
    Get a form value from the pre-parsed form data stored by the middleware.
    Falls back to empty string if not found.
    
    Args:
        request: The FastAPI request object
        key: The form field name
        default: Default value if not found
    
    Returns:
        The form value as a string
    """
    form = getattr(request.state, "form", None)
    if form and isinstance(form, dict):
        values = form.get(key, [])
        if values and len(values) > 0:
            return values[0]
    return default


def get_form_values(request: Request, key: str) -> list[str]:
    """
    Get all values for a form field from the pre-parsed form data.
    
    Args:
        request: The FastAPI request object
        key: The form field name
    
    Returns:
        List of all values for the key
    """
    form = getattr(request.state, "form", None)
    if form and isinstance(form, dict):
        return form.get(key, [])
    return []
