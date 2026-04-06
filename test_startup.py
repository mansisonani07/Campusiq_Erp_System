#!/usr/bin/env python3
"""
Test startup without database operations
"""
import os
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    # Test basic imports first
    print("Testing basic imports...")
    from app.database import Base, engine, SessionLocal
    print("✓ Database imports successful")
    
    from app.models import User, StudentProfile
    print("✓ Models imports successful")
    
    from app.auth import hash_password
    print("✓ Auth imports successful")
    
    from app.otp import generate_otp
    print("✓ OTP imports successful")
    
    from app.auth_flow import emit_dev_otp, send_login_otp
    print("✓ Auth flow imports successful")
    
    # Test OTP generation
    print("\nTesting OTP generation...")
    otp = generate_otp()
    print(f"✓ Generated OTP: {otp}")
    
    # Test OTP display
    print("\nTesting OTP display...")
    emit_dev_otp(f"[TEST] OTP: {otp}")
    print("✓ OTP display function works")
    
    print("\n🎉 All basic functionality tests passed!")
    print("The issue might be with database operations during startup.")
    
except Exception as e:
    print(f"❌ Error during startup test: {e}")
    import traceback
    traceback.print_exc()