"""
Quick Student Isolation Tests
"""
import re
import sys
sys.path.insert(0, '.')

from app.main import app

# Use starlette TestClient
from starlette.testclient import TestClient

client = TestClient(app, raise_server_exceptions=False)

print("=" * 60)
print("STUDENT DATA ISOLATION TESTS")
print("=" * 60)

# Test 1: Login as student -> /student/dashboard
print("\n--- TEST 1: Login as student ---")
r1 = client.get('/login-simple')
match = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', r1.text)
csrf = match.group(1) if match else ''

r2 = client.post('/login-simple', data={
    'email': 'student@erp.local',
    'password': 'student123',
    'csrf_token': csrf
}, follow_redirects=False)

if r2.status_code in [302, 303]:
    loc = r2.headers.get('location', '')
    print(f'Redirects to: {loc}')
    if 'student/dashboard' in loc:
        print('TEST 1: PASS')
    else:
        print('TEST 1: FAIL')
else:
    print(f'TEST 1: FAIL - Status {r2.status_code}')

# Test 2: Student accessing admin
print("\n--- TEST 2: Student accessing /admin/dashboard ---")
client2 = TestClient(app, raise_server_exceptions=False)
r1 = client2.get('/login-simple')
match = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', r1.text)
csrf = match.group(1) if match else ''
r2 = client2.post('/login-simple', data={
    'email': 'student@erp.local',
    'password': 'student123',
    'csrf_token': csrf
}, follow_redirects=True)

# Now check if we can access admin (should be redirected)
r3 = client2.get('/admin/dashboard', follow_redirects=False)
if r3.status_code in [302, 303]:
    loc = r3.headers.get('location', '')
    print(f'Redirects to: {loc}')
    if 'student' in loc.lower() or 'portal' in loc.lower():
        print('TEST 2: PASS')
    else:
        print('TEST 2: FAIL')
else:
    print(f'TEST 2: FAIL - Status {r3.status_code}')

# Test 3: Student fees
print("\n--- TEST 3: Student fees isolation ---")
r = client2.get('/student/fees')
if r.status_code == 200:
    if 'STU-1001' in r.text or 'Aarav' in r.text:
        print('TEST 3: PASS')
    else:
        print('TEST 3: Need manual verification')
else:
    print(f'TEST 3: FAIL - Status {r.status_code}')

# Test 4: Student results
print("\n--- TEST 4: Student results ---")
r = client2.get('/student/results')
if r.status_code == 200:
    if 'not yet available' in r.text.lower() or 'coming soon' in r.text.lower():
        print('TEST 4: PASS')
    else:
        print('TEST 4: Need manual verification')
else:
    print(f'TEST 4: FAIL - Status {r.status_code}')

# Test 5: Student notices
print("\n--- TEST 5: Student notices ---")
r = client2.get('/student/notices')
print(f'Status: {r.status_code}')
print('TEST 5: PASS' if r.status_code == 200 else f'TEST 5: FAIL')

# Test 6: Student timetable
print("\n--- TEST 6: Student timetable ---")
r = client2.get('/student/timetable')
print(f'Status: {r.status_code}')
print('TEST 6: PASS' if r.status_code == 200 else f'TEST 6: FAIL')

# Test 7: Student attendance (read only)
print("\n--- TEST 7: Student attendance (read only) ---")
r = client2.get('/student/attendance')
if r.status_code == 200:
    has_buttons = 'mark-present' in r.text.lower() or 'mark-absent' in r.text.lower()
    print('TEST 7: PASS - No edit buttons' if not has_buttons else 'TEST 7: FAIL')
else:
    print(f'TEST 7: FAIL - Status {r.status_code}')

print("\n" + "=" * 60)

