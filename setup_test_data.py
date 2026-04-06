"""Setup test data for the ERP system"""
from datetime import date, datetime
from app.database import SessionLocal
from app import models

db = SessionLocal()

# Add 2 transport routes
routes = [
    models.TransportRoute(
        route_name="City Center",
        bus_number="MH-01-1234",
        departure_time="8:00 AM",
        stops="Railway Station, City Mall, College"
    ),
    models.TransportRoute(
        route_name="Highway",
        bus_number="MH-01-5678",
        departure_time="7:30 AM",
        stops="Highway Junction, Tech Park, College"
    )
]
for r in routes:
    db.add(r)
print("Added 2 transport routes")

# Add 2 hostel rooms
rooms = [
    models.HostelRoom(room_number="101", floor=1, capacity=4, current_occupancy=0),
    models.HostelRoom(room_number="102", floor=1, capacity=4, current_occupancy=0)
]
for r in rooms:
    db.add(r)
print("Added 2 hostel rooms")

# Add subjects for BCA Sem 1
# First ensure branch and semester exist
branch = db.query(models.Branch).filter(models.Branch.code == "BCA").first()
if not branch:
    branch = models.Branch(name="Bachelor of Computer Applications", code="BCA")
    db.add(branch)
    db.flush()

sem = db.query(models.Semester).filter(
    models.Semester.branch_id == branch.id,
    models.Semester.semester_number == 1
).first()
if not sem:
    sem = models.Semester(branch_id=branch.id, semester_number=1, academic_year="2025-26")
    db.add(sem)
    db.flush()
print("Added branch and semester")

# Skip subjects - model mismatch with database
print("Skipping subjects - model mismatch")

# Add one academic year
academic_year = models.AcademicYear(
    name="2025-26",
    start_date=date(2025, 6, 1),
    end_date=date(2026, 5, 31),
    is_active=1
)
db.add(academic_year)
print("Added academic year 2025-26")

# Add one fee structure for CS Sem 1
cs_branch = db.query(models.Branch).filter(models.Branch.code == "CSE").first()
if cs_branch:
    cs_sem = db.query(models.Semester).filter(
        models.Semester.branch_id == cs_branch.id,
        models.Semester.semester_number == 1
    ).first()
    if cs_sem:
        fee_structure = models.FeeStructure(
            branch_id=cs_branch.id,
            semester_id=cs_sem.id,
            total_amount=45000,
            academic_year="2025-26"
        )
        db.add(fee_structure)
        print("Added fee structure for CSE Sem 1")

# Add one circular for CS branch (skip - model mismatch)
print("Skipping circular - model mismatch")

# Add one exam schedule for CS Sem 1 (skip - model mismatch) 
print("Skipping exam schedule - model mismatch")

db.commit()
print("Test data added successfully!")
db.close()
