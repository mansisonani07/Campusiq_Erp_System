from app.database import SessionLocal
from app import models

db = SessionLocal()
print('Students:', db.query(models.StudentProfile).count())
print('Courses:', db.query(models.Course).count())
print('Enrollments:', db.query(models.Enrollment).count())
print('Users:', db.query(models.User).count())
print('Fees:', db.query(models.FeeRecord).count())
db.close()
