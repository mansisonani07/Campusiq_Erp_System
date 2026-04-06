"""Test app startup to check for any import or initialization errors"""
import sys
import traceback

try:
    from app.main import app
    print("App imported successfully!")
    print(f"App title: {app.title}")
    print(f"App version: {app.version}")
    
    # Check routes
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(route.path)
    
    print(f"\nTotal routes: {len(routes)}")
    
    # Check for teacher routes
    teacher_routes = [r for r in routes if '/teacher' in r]
    print(f"Teacher routes: {teacher_routes}")
    
    # Check for student routes
    student_routes = [r for r in routes if '/student' in r]
    print(f"Student routes: {student_routes}")
    
    # Check for admin routes
    admin_routes = [r for r in routes if '/admin' in r]
    print(f"Admin routes: {admin_routes}")
    
    print("\nApp startup test PASSED!")
except Exception as e:
    print(f"App startup test FAILED: {e}")
    traceback.print_exc()
    sys.exit(1)
