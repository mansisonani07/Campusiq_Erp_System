import requests

url = 'http://localhost:8000/login'
data = {
    'login_as': 'student',
    'identifier_type': 'email',
    'identifier': 'admin@erp.local',
    'password': 'admin123'
}
r = requests.post(url, data=data)
print('Status:', r.status_code)
print('Response:', r.text[:1000])
