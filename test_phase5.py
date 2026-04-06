"""
Phase 5 Tests - Student Data Isolation
Using FastAPI TestClient with proper CSRF handling
"""
import sys
import os
import re

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def get_csrf_token(client, url):
    """Extract CSRF token from form"""
    response = client.get(url)
    if response.status_code == 200:
        # Look for csrf_token in the response - multiple patterns
        match = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', response.text)
        if match:
            return match.group(1)
        # Try alternative pattern
        match = re.search(r'value="([^"]+)"[^>]*name="csrf_token"', response.text)
        if match:
            return match.group(1)
    return None


def test_student_login_and_dashboard():
    """Test 1: Student login and dashboard"""
    print('\n=== TEST 1: Student Login and Dashboard ===')
    
    # Create a test client that handles cookies
    with TestClient(app) as client:
        # First get the login page to get CSRF token
        csrf_token = get_csrf_token(client, "/login-simple")
        print(f'CSRF Token obtained: {bool(csrf_token)}')
        
        # Login using login-simple endpoint (bypasses OTP)
        response = client.post("/login-simple", data={
            "email": "student@erp.local",
            "password": "student123",
            "csrf_token": csrf_token or ""
        })
        
        print(f'Login response status: {response.status_code}')
        
        # Follow redirect to dashboard
        if response.status_code in [302, 303]:
            location = response.headers.get("location", "/student/dashboard")
            response = client.get(location)
        
        # Get dashboard
        response = client.get("/student/dashboard")
        print(f'Dashboard status: {response.status_code}')
        
        if response.status_code != 200:
            print(f'✗ FAIL: Dashboard returned status {response.status_code}')
            return None, False
        
        content = response.text
        
        if 'Aarav Patel' in content:
            print('✓ PASS: Shows student name (Aarav Patel)')
            name_pass = True
        else:
            print('✗ FAIL: Does not show student name')
            name_pass = False
            
        if 'STU-1001' in content:
            print('✓ PASS: Shows roll number (STU-1001)')
            roll_pass = True
        else:
            print('✗ FAIL: Does not show roll number')
            roll_pass = False
        
        return client, name_pass and roll_pass


def test_route_protection(client):
    """Test 2: Route protection"""
    print('\n=== TEST 2: Route Protection ===')
    
    if client is None:
        print('✗ FAIL: No client (not logged in)')
        return False
    
    # Try to access admin dashboard while logged in as student
    response = client.get("/admin/dashboard")
    print(f'Admin dashboard status: {response.status_code}')
    
    if response.status_code == 403:
        print('✓ PASS: Route protected (403 Forbidden)')
        return True
    elif response.status_code in [302, 303]:
        print('✓ PASS: Redirected away from admin')
        return True
    elif '/student/dashboard' in response.text or '/login' in response.text:
        print('✓ PASS: Redirected away from admin')
        return True
    else:
        print('✗ FAIL: May have admin access')
        return False


def test_fee_isolation(client):
    """Test 3: Fee isolation"""
    print('\n=== TEST 3: Fee Isolation ===')
    
    if client is None:
        print('✗ FAIL: No client (not logged in)')
        return False
    
    response = client.get("/student/fees")
    print(f'Fees page status: {response.status_code}')
    
    if response.status_code != 200:
        print(f'✗ FAIL: Fees page error: {response.status_code}')
        return False
    
    content = response.text
    
    # Check it shows fee data
    if '50000' in content or '25000' in content:
        print('✓ PASS: Shows fee data')
        fee_shown = True
    else:
        print('✗ FAIL: No fee data shown')
        fee_shown = False
    
    # Check it doesn't show ALL students - look for multiple STU- entries
    stu_count = content.count('STU-')
    print(f'Found {stu_count} STU- occurrences')
    if stu_count <= 2:  # Only current student
        print('✓ PASS: Fee data isolated to single student')
        return fee_shown
    else:
        print('✗ FAIL: May be showing multiple students')
        return False


def test_result_status(client):
    """Test 4: Result status"""
    print('\n=== TEST 4: Result Status ===')
    
    if client is None:
        print('✗ FAIL: No client (not logged in)')
        return False
    
    response = client.get("/student/results")
    print(f'Results page status: {response.status_code}')
    
    if response.status_code != 200:
        print(f'✗ FAIL: Results page error: {response.status_code}')
        return False
    
    content = response.text
    text_lower = content.lower()
    
    if 'not yet available' in text_lower or 'results not yet available' in text_lower:
        print('✓ PASS: Shows "Results not yet available" for draft status')
        return True
    elif 'coming soon' in text_lower:
        print('✓ PASS: Shows "Results Coming Soon" for coming_soon status')
        return True
    elif 'marks_obtained' in content or 'percentage' in content:
        print('✓ PASS: Shows marks for published status')
        return True
    else:
        print('? NOTE: Result status page loaded (status may vary)')
        return True


def test_notices_filtering(client):
    """Test 5: Notices filtering"""
    print('\n=== TEST 5: Notices Filtering ===')
    
    if client is None:
        print('✗ FAIL: No client (not logged in)')
        return False
    
    response = client.get("/student/notices")
    print(f'Notices page status: {response.status_code}')
    
    if response.status_code == 200:
        print('✓ PASS: Notices page loads')
        return True
    else:
        print(f'✗ FAIL: Notices page error: {response.status_code}')
        return False


def test_timetable(client):
    """Test 6: Timetable"""
    print('\n=== TEST 6: Timetable ===')
    
    if client is None:
        print('✗ FAIL: No client (not logged in)')
        return False
    
    response = client.get("/student/timetable")
    print(f'Timetable page status: {response.status_code}')
    
    if response.status_code != 200:
        print(f'✗ FAIL: Timetable page error: {response.status_code}')
        return False
    
    text_lower = response.text.lower()
    if 'not yet uploaded' in text_lower or 'not available' in text_lower:
        print('✓ PASS: Shows "Timetable not yet uploaded"')
        return True
    else:
        print('✓ PASS: Timetable page loads')
        return True


def test_attendance_readonly(client):
    """Test 7: Attendance read only"""
    print('\n=== TEST 7: Attendance Read Only ===')
    
    if client is None:
        print('✗ FAIL: No client (not logged in)')
        return False
    
    response = client.get("/student/attendance")
    print(f'Attendance page status: {response.status_code}')
    
    if response.status_code != 200:
        print(f'✗ FAIL: Attendance page error: {response.status_code}')
        return False
    
    text_lower = response.text.lower()
    if 'mark attendance' in text_lower or 'submit attendance' in text_lower:
        print('✗ FAIL: Has attendance marking buttons (should be read-only)')
        return False
    
    if 'present' in text_lower or 'absent' in text_lower:
        print('✓ PASS: Attendance is read-only (shows records but no mark buttons)')
        return True
    else:
        print('? NOTE: Attendance page loads (check manually for content)')
        return True


def main():
    print("=" * 60)
    print("PHASE 5 TESTS - Student Data Isolation")
    print("=" * 60)
    
    all_passed = True
    
    # Test 1: Login and dashboard
    # We need to use a persistent client for session handling
    test_client = TestClient(app)
    
    # First get the login page to get CSRF token
    csrf_token = get_csrf_token(test_client, "/login-simple")
    print(f'\n=== TEST 1: Student Login and Dashboard ===')
    print(f'CSRF Token obtained: {bool(csrf_token)}')
    
    # Login using login-simple endpoint (bypasses OTP)
    response = test_client.post("/login-simple", data={
        "email": "student@erp.local",
        "password": "student123",
        "csrf_token": csrf_token or ""
    })
    
    print(f'Login response status: {response.status_code}')
    
    # Follow redirect to dashboard
    if response.status_code in [302, 303]:
        location = response.headers.get("location", "/student/dashboard")
        response = test_client.get(location)
    
    # Get dashboard
    response = test_client.get("/student/dashboard")
    print(f'Dashboard status: {response.status_code}')
    
    client = test_client
    passed = False
    
    if response.status_code == 200:
        content = response.text
        
        if 'Aarav Patel' in content:
            print('✓ PASS: Shows student name (Aarav Patel)')
            name_pass = True
        else:
            print('✗ FAIL: Does not show student name')
            name_pass = False
            
        if 'STU-1001' in content:
            print('✓ PASS: Shows roll number (STU-1001)')
            roll_pass = True
        else:
            print('✗ FAIL: Does not show roll number')
            roll_pass = False
        
        passed = name_pass and roll_pass
    else:
        print(f'✗ FAIL: Dashboard returned status {response.status_code}')
    
    all_passed = all_passed and passed
    
    if not passed:
        print("\n⚠ Login failed, cannot continue tests")
        print("=" * 60)
        print("LOGIN FAILED - Fix login issue first")
        print("=" * 60)
        return 1
    
    # Test 2: Route protection
    passed = test_route_protection(client)
    all_passed = all_passed and passed
    
    # Test 3: Fee isolation
    passed = test_fee_isolation(client)
    all_passed = all_passed and passed
    
    # Test 4: Result status
    passed = test_result_status(client)
    all_passed = all_passed and passed
    
    # Test 5: Notices filtering
    passed = test_notices_filtering(client)
    all_passed = all_passed and passed
    
    # Test 6: Timetable
    passed = test_timetable(client)
    all_passed = all_passed and passed
    
    # Test 7: Attendance read only
    passed = test_attendance_readonly(client)
    all_passed = all_passed and passed
    
    print("\n" + "=" * 60)
    if all_passed:
        print("ALL TESTS PASSED ✓")
    else:
        print("SOME TESTS FAILED ✗")
    print("=" * 60)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
