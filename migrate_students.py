# Migrate existing students to have branch_id and semester_id based on their department and year

from app.database import SessionLocal
from app.models import StudentProfile, Branch, Semester

db = SessionLocal()

# Get all branches
branches = db.query(Branch).all()
branch_map = {}
for b in branches:
    # Map branch name to id
    branch_map[b.name.lower()] = b.id
    branch_map[b.code.lower()] = b.id
    # Also map partial matches
    if 'computer' in b.name.lower() or 'cse' in b.code.lower() or 'it' in b.code.lower():
        branch_map['computer'] = b.id
        branch_map['it'] = b.id
    if 'bca' in b.name.lower() or 'bca' in b.code.lower():
        branch_map['bca'] = b.id
    if 'mca' in b.name.lower() or 'mca' in b.code.lower():
        branch_map['mca'] = b.id
    if 'mba' in b.name.lower() or 'mba' in b.code.lower():
        branch_map['mba'] = b.id
    if 'bba' in b.name.lower() or 'bba' in b.code.lower():
        branch_map['bba'] = b.id

# Get all semesters
semesters = db.query(Semester).all()
semester_map = {}
for s in semesters:
    semester_map[s.semester_number] = s.id

# Update all students
students = db.query(StudentProfile).all()
print(f'Processing {len(students)} students...')

for student in students:
    old_branch_id = student.branch_id
    old_semester_id = student.semester_id
    
    # Try to find branch from department name
    if not student.branch_id and student.department:
        dept_lower = student.department.lower()
        for key, bid in branch_map.items():
            if key in dept_lower:
                student.branch_id = bid
                print(f'Student {student.roll_no}: set branch_id to {bid} from dept {student.department}')
                break
    
    # Try to find semester from year
    if not student.semester_id and student.year:
        y = int(student.year) if isinstance(student.year, str) else student.year
        if y in semester_map:
            student.semester_id = semester_map[y]
            print(f'Student {student.roll_no}: set semester_id to {semester_map[y]} from year {student.year}')

db.commit()
print('Migration complete!')

# Verify
students = db.query(StudentProfile).all()
with_branch = sum(1 for s in students if s.branch_id)
with_semester = sum(1 for s in students if s.semester_id)
print(f'Students with branch_id: {with_branch}/{len(students)}')
print(f'Students with semester_id: {with_semester}/{len(students)}')

db.close()
