import urllib.request
import urllib.parse
import re
import http.cookiejar

# Create a cookie jar to maintain session
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# First, get the login page to get CSRF token and session cookie
req = urllib.request.Request('http://localhost:8000/login')
with opener.open(req) as response:
    html = response.read().decode('utf-8')

print('Cookies:', [c.name + '=' + c.value for c in cj])

# Extract CSRF token from the form
match = re.search(r'name="csrf_token" value="([^"]+)"', html)
if match:
    csrf_token = match.group(1)
    print('CSRF Token from form:', csrf_token[:30], '...')
else:
    print('No CSRF token found in form')
    csrf_token = ''

# Now try to login with CSRF token in both form data AND header
# The session cookie should be automatically included by the cookie jar
login_data = urllib.parse.urlencode({
    'login_as': 'admin',
    'identifier_type': 'email',
    'identifier': 'admin@erp.local',
    'password': 'admin123',
    'csrf_token': csrf_token,
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/login', data=login_data)
req.add_header('Content-Type', 'application/x-www-form-urlencoded')
req.add_header('X-CSRF-Token', csrf_token)

try:
    with opener.open(req) as response:
        print('Status:', response.status)
        body = response.read().decode('utf-8')
        print('Response length:', len(body))
        print('First 1500 chars:', body[:1500])
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    body = e.read().decode('utf-8')
    print('Body:', body[:1500])
except Exception as e:
    print('Error:', type(e).__name__, e)
