# Add transport and hostel permissions

print("=== Adding Permissions ===")

with open('app/permissions.py', 'r') as f:
    content = f.read()

# Add transport and hostel to ROLE_PERMISSIONS
if '"transport.manage"' not in content:
    # Find where permissions are defined and add transport/hostel
    old_perms = '"fees.manage": ["admin", "accountant"],'
    new_perms = '''"fees.manage": ["admin", "accountant"],
    "transport.view": ["admin", "accountant"],
    "transport.manage": ["admin", "accountant"],
    "hostel.view": ["admin", "accountant"],
    "hostel.manage": ["admin", "accountant"],'''
    
    content = content.replace(old_perms, new_perms)

with open('app/permissions.py', 'w') as f:
    f.write(content)

print("Permissions added")

# Also add sync for student_profile_id in sync_student_session
with open('app/routers/student.py', 'r') as f:
    content = f.read()

old_sync = '''def sync_student_session(request: Request, profile: models.StudentProfile):
    """Sync branch_id and semester_id to session"""
    if profile.branch_id:
        request.session["branch_id"] = profile.branch_id
    if profile.semester_id:
        request.session["semester_id"] = profile.semester_id'''

new_sync = '''def sync_student_session(request: Request, profile: models.StudentProfile):
    """Sync branch_id and semester_id to session"""
    if profile.branch_id:
        request.session["branch_id"] = profile.branch_id
    if profile.semester_id:
        request.session["semester_id"] = profile.semester_id
    # Sync student_profile_id for transport/hostel lookups
    request.session["student_profile_id"] = profile.id'''

content = content.replace(old_sync, new_sync)

with open('app/routers/student.py', 'w') as f:
    f.write(content)

print("Student session sync updated")

print("\n=== Complete ===")
