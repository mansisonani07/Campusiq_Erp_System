from urllib.parse import urlencode
from urllib.request import urlopen, Request
import http.cookiejar

# Create a cookie jar to handle sessions
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# First get the login page to get CSRF token
req = Request('http://localhost:8000/login')
with opener.open(req) as response:
    html = response.read().decode('utf-8')

# Extract CSRF token from the form
import re
match = re.search(r'name="csrf_token" value="([^"]+)"', html)
if match:
    csrf_token = match.group(1)
    print('CSRF Token found:', csrf_token[:20] + '...')
else:
    print('No CSRF token found in HTML')
    csrf_token = ''

# Login data with CSRF token
login_data = urlencode({
    'login_as': 'student',
    'identifier_type': 'email',
    'identifier': 'admin@erp.local',
    'password': 'admin123',
    'csrf_token': csrf_token,
}).encode('utf-8')

# Make login request
req = Request('http://localhost:8000/login', data=login_data)
req.add_header('Content-Type', 'application/x-www-form-urlencoded')

try:
    with opener.open(req) as response:
        print('Status:', response.status)
        body = response.read().decode('utf-8')
        print('Response (first 1500 chars):', body[:1500])
except Exception as e:
    print('Error:', e)
