# Nova Student ERP System - LinkedIn Project Overview

---

## Project Description

A comprehensive **Student Enterprise Resource Planning (ERP) System** built from scratch using **Python and FastAPI**. This full-stack educational management platform provides role-based access control, advanced analytics, OTP authentication, and an automated risk intervention system.

---

## Technology Stack

- **Backend Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy
- **Database**: SQLite (local) / PostgreSQL (cloud-ready)
- **Templating**: Jinja2
- **Authentication**: Session-based with OTP verification (Email & SMS)
- **Frontend**: HTML5, CSS3, JavaScript with HTMX
- **Server**: Uvicorn

---

## What I Built (Custom Implementation)

### 1. Multi-Role Access Control System
- Custom RBAC (Role-Based Access Control) with 5 roles: Admin, Teacher, Accountant, Counselor, Student
- Each role has specific permissions and dedicated dashboards
- Route protection middleware

### 2. Authentication System
- **Custom OTP generation and verification** (6-digit codes)
- Email OTP delivery via SMTP
- SMS OTP delivery (Twilio, Textbelt, or custom API support)
- Device approval system for security
- Password reset via OTP
- Session management with idle timeout

### 3. Student Management Module
- Student enrollment and profiles
- Academic records tracking
- Branch & semester management
- Student ID card generation
- Bulk student import/export (Excel)
- Student promotion system

### 4. Academic Management
- Course creation and management
- Subject management
- Student course enrollment
- Timetable upload and management
- Exam schedule management
- Results publishing workflow
- Study materials distribution
- Academic year management

### 5. Attendance System
- Real-time attendance tracking
- Attendance reports by branch/semester
- Export to Excel

### 6. Grade Management
- Exam grades entry
- Grade analytics
- Results publishing

### 7. Fee Management
- Fee structure by branch/semester
- Payment tracking
- Automated payment reminders queue
- Downloadable fee receipts (text format)
- Fee status tracking

### 8. Risk Intervention Engine (Unique Feature)
- **Custom algorithm** for risk scoring based on:
  - Attendance patterns
  - Grade performance
- Automated recommendations
- Early warning system for at-risk students

### 9. Communication Systems
- Announcements (targeted by audience)
- Circulars (branch/semester specific)
- Notice board with role-based targeting

### 10. Infrastructure Management
- **Transport**: Route management, bus assignment, pickup points
- **Hostel**: Room management, bed allocation, occupancy tracking

### 11. Advanced Admin Dashboard
- KPIs with 30-day trends
- Fee collection analytics
- Attendance metrics
- Action center with pending tasks
- Real-time data via live endpoint

### 12. Security Features
- Custom session management with idle timeout
- CSRF protection on all forms
- Role-based route guards
- Audit logging of admin actions
- Device approval system
- OTP-based two-factor authentication

---

## Database Schema (25+ Tables)

Custom models for:
- Users, Student Profiles, Teacher Profiles
- Courses, Enrollments, Subjects
- Attendance, Grades, Results
- Fee Records, Fee Structures
- Announcements, Circulars, Notices
- Transport Routes, Hostel Rooms
- Academic Years, Study Materials
- Leave Applications, Notifications
- Audit Logs, Sessions

---

## Key Skills Demonstrated

✅ **Full-Stack Web Development** - Complete end-to-end application  
✅ **FastAPI Framework** - REST API design with Python  
✅ **Database Architecture** - SQLAlchemy ORM, schema design  
✅ **Authentication & Security** - OTP, sessions, CSRF, RBAC  
✅ **Data Analytics** - KPIs, trends, reporting  
✅ **Excel Export** - openpyxl integration  
✅ **Form Handling** - Custom form parsing and validation  
✅ **Session Management** - Cookie-based with timeout  
✅ **Role-Based Access Control** - Custom permission system  
✅ **Email/SMS Integration** - OTP delivery systems  

---

## How to Run

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload

# Open browser
http://127.0.0.1:8000
```

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@erp.local | admin123 |
| Teacher | teacher@erp.local | teacher123 |
| Accountant | accountant@erp.local | account123 |
| Counselor | counselor@erp.local | counsel123 |
| Student | student@erp.local | student123 |

---

## Cloud Deployment Ready

- PostgreSQL compatible (Neon, Supabase, Render)
- Environment-based configuration
- Production-ready settings available

---

## Sample LinkedIn Post

🚀 Excited to share my latest project: **Nova Student ERP System** - A comprehensive educational management platform built with **Python & FastAPI**!

🎯 **Key Highlights:**
• Multi-role access control (Admin, Teacher, Accountant, Counselor, Student)
• Complete student lifecycle management
• Custom OTP-based authentication (Email & SMS)
• Automated risk intervention engine for early student support
• Real-time attendance & grade tracking
• Fee management with automated reminders
• Transport & Hostel management
• Excel export capabilities
• Cloud-ready architecture (PostgreSQL)

🛠️ **Tech Stack:** Python, FastAPI, SQLAlchemy, Jinja2, HTMX, Uvicorn

This project demonstrates enterprise-level full-stack development with FastAPI, including custom authentication systems, role-based access control, data analytics, and modern web interfaces. An excellent portfolio piece showcasing production-ready Python web development! 🎓

#Python #FastAPI #FullStack #ERP #EducationTech #WebDevelopment #SQLAlchemy
