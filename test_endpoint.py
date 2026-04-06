import urllib.request
import urllib.parse

try:
    r = urllib.request.urlopen('http://localhost:8000/login')
    content = r.read().decode('utf-8')
    print('Status:', r.status)
    print('Contains login form:', 'login' in content.lower() or 'email' in content.lower())
except Exception as e:
    print('Error:', e)
