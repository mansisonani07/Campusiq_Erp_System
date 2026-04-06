import requests

# Test basic endpoints
endpoints = [
    "/",
    "/login",
    "/open-portal",
    "/competencies",
]

session = requests.Session()

for endpoint in endpoints:
    try:
        url = f"http://localhost:8000{endpoint}"
        resp = session.get(url, timeout=5)
        print(f"{endpoint}: Status {resp.status_code}, Length {len(resp.text)}")
    except Exception as e:
        print(f"{endpoint}: Error - {type(e).__name__}: {e}")
