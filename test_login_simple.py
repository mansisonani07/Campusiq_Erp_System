import urllib.request
import urllib.parse
import re
import http.cookiejar

# Create a cookie jar to persist cookies
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# First get the login page to get CSRF token
req = urllib.request.Request('http://localhost:8000/login-simple')
r = opener.open(req)
print(f'GET /login-simple: {r.status}')

# Extract CSRF token from the page
content = r.read().decode('utf-8')
match = re.search(r'name="csrf_token" value="([^"]+)"', content)
if match:
    csrf_token = match.group(1)
    print(f'CSRF token found: {csrf_token[:20]}...')
    
    # Now post with CSRF token
    data = urllib.parse.urlencode({
        'email': 'admin@erp.local',
        'password': 'admin123',
        'csrf_token': csrf_token
    }).encode('utf-8')
    
    req = urllib.request.Request('http://localhost:8000/login-simple', data=data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    try:
        r = opener.open(req)
        print(f'POST /login-simple: {r.status}')
        print(f'Response: {r.read().decode("utf-8")[:500]}')
    except urllib.error.HTTPError as e:
        print(f'POST /login-simple: {e.code}')
        print(f'Redirect: {e.headers.get("Location")}')
else:
    print('No CSRF token found')
    print(f'Page content: {content[:500]}')
