from app.database import SessionLocal
from app.models import User
from app.auth import verify_password

db = SessionLocal()
u = db.query(User).filter(User.email == 'admin@erp.local').first()
if u:
    print('User:', u.name)
    print('Hash:', u.password_hash[:50])
    print('Verify admin123:', verify_password('admin123', u.password_hash))
else:
    print('User not found')
db.close()
