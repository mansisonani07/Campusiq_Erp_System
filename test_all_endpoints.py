import urllib.request

endpoints = [
    'http://localhost:8000/',
    'http://localhost:8000/login',
    'http://localhost:8000/register',
    'http://localhost:8000/open-portal'
]

for url in endpoints:
    try:
        r = urllib.request.urlopen(url)
        content = r.read().decode('utf-8')
        print(f'{url}: Status {r.status}')
    except Exception as e:
        print(f'{url}: Error - {e}')
