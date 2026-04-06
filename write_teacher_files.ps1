# PowerShell script to write teacher template files
$baseUrl = "https://files.catbox.moe"

# Teacher base.html content
$baseContent = @"
{% extends "base.html" %}

{% block title %}Teacher Portal - CampusIQ{% endblock %}

{% block navbar %}
<nav class="navbar" style="background: rgba(8,15,26,0.97); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 1px 0 rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 3px; z-index: 100;">
    <div class="nav-brand">
        <a href="/teacher/dashboard" style="display:flex; align-items:center; gap:10px; text-decoration:none;">
            <div style="width:38px; height:38px; background:linear-gradient(135deg,#0a4a5c,#12b8a0); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 12px rgba(18,184,160,0.3);">&#127891;</div>
            <div>
                <div style="font-size:17px; font-weight:800; color:#ffffff; letter-spacing:-0.3px; line-height:1.1;">CampusIQ</div>
                <div style="font-size:9px; color:#12b8a0; letter-spacing:2px; text-transform:uppercase; font-weight:600;">Smart Campus</div>
            </div>
        </a>
    </div>
    <div class="nav-user" style="display:flex; align-items:center; gap:14px;">
        <span style="background:linear-gradient(135deg,rgba(255,107,53,0.2),rgba(255,160,64,0.15)); color:#ffa040; padding:5px 14px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:1.5px; border:1px solid rgba(255,107,53,0.3);">TEACHER</span>
        <span style="color:rgba(255,255,255,0.7); font-size:14px; font-weight:500;">{{ user.name }}</span>
        <a href="/logout" style="background:rgba(255,107,53,0.1); color:#ff8866; border:1px solid rgba(255,107,53,0.25); border-radius:8px; padding:7px 18px; text-decoration:none; font-size:13px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,107,53,0.22)';this.style.color='#fff'" onmouseout="this.style.background='rgba(255,107,53,0.1)';this.style.color='#ff8866'">Logout</a>
    </div>
</nav>
{% endblock %}

{% block sidebar %}
<aside class="app-sidebar panel" aria-label="Primary menu" style="background: linear-gradient(180deg, #0a1628 0%, #080f1a 100%); border-right: 1px solid rgba(255,255,255,0.06); box-shadow: 4px 0 24px rgba(0,0,0,0.3); padding: 20px 0;">
    <div style="padding: 0 16px 16px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="color:rgba(255,255,255,0.2); font-size:10px; letter-spacing:2px; text-transform:uppercase; font-weight:700;">Navigation</div>
    </div>
    <nav class="app-menu" style="padding: 4px 0;">
        <a class="app-menu-link{% if request.url.path == '/teacher/dashboard' %} active{% endif %}" href="/teacher/dashboard">&#127968; Dashboard</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/students' %} active{% endif %}" href="/teacher/students">&#128101; My Students</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/attendance' %} active{% endif %}" href="/teacher/attendance">&#9989; Attendance</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/grades' %} active{% endif %}" href="/teacher/grades">&#128202; Marks Entry</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/leave-applications' %} active{% endif %}" href="/teacher/leave-applications">&#128203; Leave Applications</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/study-materials' %} active{% endif %}" href="/teacher/study-materials">&#128218; Study Materials</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/notices' %} active{% endif %}" href="/teacher/notices">&#128226; Notices</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/circulars' %} active{% endif %}" href="/teacher/circulars">&#128196; Circulars</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/exam-schedule' %} active{% endif %}" href="/teacher/exam-schedule">&#128197; Exam Schedule</a>
        <a class="app-menu-link{% if request.url.path == '/teacher/profile' %} active{% endif %}" href="/teacher/profile">&#128100; My Profile</a>
    </nav>
</aside>
{% endblock %}

{% block styles %}
{{ super() }}
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', 'Calibri', sans-serif !important; background: #080f1a !important; color: #ffffff; }
    body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #ff6b35, #ffd166, #12b8a0, #ffd166, #ff6b35); background-size: 200% 100%; animation: topbarshine 3s linear infinite; z-index: 9999; }
    @keyframes topbarshine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .app-menu-link { display: flex !important; align-items: center; gap: 10px; color: rgba(255,255,255,0.4) !important; padding: 11px 18px !important; border-radius: 10px !important; margin: 2px 10px !important; transition: all 0.2s ease !important; font-size: 14px !important; font-weight: 500 !important; text-decoration: none !important; border-left: 3px solid transparent !important; }
    .app-menu-link:hover { background: rgba(18,184,160,0.08) !important; color: rgba(255,255,255,0.85) !important; transform: translateX(3px) !important; border-left-color: rgba(18,184,160,0.5) !important; }
    .app-menu-link.active { background: linear-gradient(135deg, rgba(255,107,53,0.15), rgba(18,184,160,0.08)) !important; color: #ffffff !important; font-weight: 700 !important; border-left: 3px solid #ff6b35 !important; }
    .main-content { background: #080f1a !important; min-height: 100vh; }
    .app-layout, .app-body, main { background: #080f1a !important; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #080f1a; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(#12b8a0, #ff6b35); border-radius: 3px; }
</style>
{% endblock %}
"@

# Teacher dashboard.html content
$dashboardContent = @"
{% extends "teacher/base.html" %}
{% block title %}Teacher Dashboard — CampusIQ{% endblock %}
{% block content %}
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.dash-wrap { font-family: 'Plus Jakarta Sans', 'Calibri', sans-serif; background: radial-gradient(ellipse 70% 50% at 5% 10%, rgba(18,184,160,0.1) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 95% 90%, rgba(255,107,53,0.08) 0%, transparent 50%), #080f1a; min-height: 100vh; padding: 28px 32px; overflow-x: hidden; }
.welcome-banner { background: linear-gradient(120deg, #0a2233 0%, #0d3348 40%, #0a4a3a 100%); border: 1px solid rgba(18,184,160,0.2); border-radius: 20px; padding: 32px 36px; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.4); }
.welcome-banner::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #ff6b35, #ffd166, #12b8a0, #ffd166, #ff6b35); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.welcome-banner h1 { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px; }
.welcome-banner .sub { color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 20px 0; font-weight: 500; }
.badge-row { display: flex; gap: 10px; flex-wrap: wrap; }
.badge { border-radius: 20px; padding: 7px 18px; font-size: 13px; font-weight: 600; display: inline-block; }
.badge-white { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.15); }
.badge-green { background: rgba(6,214,160,0.15); color: #06d6a0; border: 1px solid rgba(6,214,160,0.25); }
.badge-yellow { background: rgba(255,209,102,0.15); color: #ffd166; border: 1px solid rgba(255,209,102,0.25); }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { border-radius: 18px; padding: 26px 24px; position: relative; overflow: hidden; cursor: pointer; transition: transform 0.25s, box-shadow 0.25s; border: 1px solid rgba(255,255,255,0.06); }
.stat-card:hover { transform: translateY(-5px); }
.stat-card-navy { background: linear-gradient(135deg, #0d2535, #0f3d55); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.stat-card-teal  { background: linear-gradient(135deg, #065a4a, #0a8a70); box-shadow: 0 8px 32px rgba(6,214,160,0.2); }
.stat-card-red   { background: linear-gradient(135deg, #6a1a08, #c0380f); box-shadow: 0 8px 32px rgba(255,107,53,0.2); }
.stat-card-gold  { background: linear-gradient(135deg, #5a3a00, #aa7000); box-shadow: 0 8px 32px rgba(255,209,102,0.2); }
.stat-label { color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px; }
.stat-value { color: #ffffff; font-size: 44px; font-weight: 800; line-height: 1; margin-bottom: 10px; letter-spacing: -2px; }
.stat-icon { font-size: 28px; opacity: 0.8; }
.panel-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.panel { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 26px; box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
.panel-accent-orange { border-top: 3px solid #ff6b35; }
.panel-accent-teal   { border-top: 3px solid #12b8a0; }
.panel-accent-yellow { border-top: 3px solid #ffd166; }
.panel-accent-blue   { border-top: 3px solid #4a9eff; }
.panel-title { font-size: 15px; font-weight: 700; color: #ffffff; margin: 0 0 18px 0; display: flex; align-items: center; gap: 8px; }
.panel-title span.count { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-size: 12px; padding: 2px 10px; border-radius: 12px; font-weight: 600; }
.dash-table { width: 100%; border-collapse: collapse; }
.dash-table th { text-align: left; padding: 8px 10px; color: rgba(255,255,255,0.35); font-size: 11px; letter-spacing: 0.8px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: 600; }
.dash-table td { padding: 10px 10px; color: rgba(255,255,255,0.8); font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 500; }
.dash-table tr:last-child td { border-bottom: none; }
.dash-table tr:hover td { background: rgba(255,255,255,0.03); }
.td-danger { color: #ff8866 !important; font-weight: 700 !important; }
.notice-item { padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.03); margin-bottom: 10px; border-left: 3px solid #ff6b35; transition: all 0.2s; cursor: pointer; }
.notice-item:hover { background: rgba(255,107,53,0.08); transform: translateX(3px); }
.notice-item h4 { margin: 0 0 4px; font-weight: 700; color: #ffffff; font-size: 14px; }
.notice-item p  { margin: 0; color: rgba(255,255,255,0.45); font-size: 13px; }
.exam-item { padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.03); margin-bottom: 10px; border-left: 3px solid #ffd166; transition: all 0.2s; }
.exam-item:hover { background: rgba(255,209,102,0.08); transform: translateX(3px); }
.exam-item h4 { margin: 0 0 4px; font-weight: 700; color: #ffffff; font-size: 14px; }
.exam-item p  { margin: 0; color: rgba(255,255,255,0.45); font-size: 13px; }
.empty-state { color: rgba(255,255,255,0.3); font-size: 14px; font-weight: 500; padding: 8px 0; }
.empty-state-good { color: #5dd8c8; font-weight: 600; font-size: 14px; padding: 8px 0; }
.btn-primary { background: linear-gradient(135deg, #ff6b35, #ffa040); color: white; border: none; border-radius: 10px; padding: 11px 22px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; margin-top: 16px; transition: all 0.2s; box-shadow: 0 4px 16px rgba(255,107,53,0.3); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,107,53,0.4); }
.btn-outline { background: transparent; color: #12b8a0; border: 1.5px solid #12b8a0; border-radius: 10px; padding: 11px 22px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; margin-top: 16px; transition: all 0.2s; }
.btn-outline:hover { background: #12b8a0; color: #080f1a; transform: translateY(-2px); }
.quick-actions-bar { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 22px 28px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
.qa-label { color: rgba(255,255,255,0.5); font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; margin-right: 4px; }
.qa-btn { border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
.qa-btn-orange { background: linear-gradient(135deg, #ff6b35, #ffa040); color: white; box-shadow: 0 4px 14px rgba(255,107,53,0.3); }
.qa-btn-orange:hover { transform: translateY(-2px); }
.qa-btn-teal { background: linear-gradient(135deg, #0a8a70, #12b8a0); color: white; box-shadow: 0 4px 14px rgba(18,184,160,0.25); }
.qa-btn-teal:hover { transform: translateY(-2px); }
.qa-btn-ghost { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.08); }
.qa-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #ffffff; transform: translateY(-1px); }
@media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } .panel-grid-2 { grid-template-columns: 1fr; } .dash-wrap { padding: 16px; } }
</style>

<div class="dash-wrap">
    <div class="welcome-banner">
        <h1>&#128075; Welcome back, {{ user.name }}!</h1>
        <p class="sub">&#128218; {{ branch.name if branch else 'Branch not assigned' }} &#8212; Semester {{ semester.semester_number if semester else '-' }}</p>
        <div class="badge-row">
            <span class="badge badge-white">&#128101; {{ student_count }} Students</span>
            <span class="badge badge-green">&#9989; Attendance Open</span>
            <span class="badge badge-yellow">&#9203; {{ pending_leaves_count }} Pending Leaves</span>
        </div>
    </div>

    <div class="stat-grid">
        <div class="stat-card stat-card-navy">
            <div class="stat-label">Total Students</div>
            <div class="stat-value">{{ student_count }}</div>
            <div class="stat-icon">&#128101;</div>
        </div>
        <div class="stat-card stat-card-teal">
            <div class="stat-label">Present Today</div>
            <div class="stat-value">{{ present_today }}</div>
            <div class="stat-icon">&#9989;</div>
        </div>
        <div class="stat-card stat-card-red">
            <div class="stat-label">Absent Today</div>
            <div class="stat-value">{{ absent_today }}</div>
            <div class="stat-icon">&#10060;</div>
        </div>
        <div class="stat-card stat-card-gold">
            <div class="stat-label">Not Marked</div>
            <div class="stat-value">{{ not_marked_today }}</div>
            <div class="stat-icon">&#9203;</div>
        </div>
    </div>

    <div class="panel-grid-2">
        <div class="panel panel-accent-orange">
            <div class="panel-title">&#9888; Low Attendance Students <span class="count">{{ low_attendance_count }}</span></div>
            {% if low_attendance %}
            <table class="dash-table">
                <thead><tr><th>Roll No</th><th>Name</th><th>Attendance</th></tr></thead>
                <tbody>{% for s in low_attendance %}<tr><td>{{ s.roll_no }}</td><td>{{ s.name }}</td><td class="td-danger">{{ s.pct }}%</td></tr>{% endfor %}</tbody>
            </table>
            {% else %}<p class="empty-state-good">&#10003; All students have good attendance</p>{% endif %}
            <a href="/teacher/students" class="btn-primary">View All Students</a>
        </div>
        <div class="panel panel-accent-teal">
            <div class="panel-title">&#128203; Pending Leave Requests <span class="count">{{ pending_leaves_count }}</span></div>
            {% if pending_leaves %}
            <table class="dash-table">
                <thead><tr><th>Student</th><th>From</th><th>To</th></tr></thead>
                <tbody>{% for leave in pending_leaves %}<tr><td>{{ leave.student_name }}</td><td>{{ leave.from_date }}</td><td>{{ leave.to_date }}</td></tr>{% endfor %}</tbody>
            </table>
            {% else %}<p class="empty-state-good">&#10003; No pending leave requests</p>{% endif %}
            <a href="/teacher/leave-applications" class="btn-outline">Manage Leaves</a>
        </div>
    </div>

    <div class="panel-grid-2">
        <div class="panel panel-accent-yellow">
            <div class="panel-title">&#128226; Recent Notices</div>
            {% if notices %}{% for notice in notices %}<div class="notice-item"><h4>{{ notice.title }}</h4><p>{{ notice.content[:100] }}{% if notice.content|length > 100 %}...{% endif %}</p></div>{% endfor %}
            {% else %}<p class="empty-state">No recent notices.</p>{% endif %}
            <a href="/teacher/notices" class="btn-primary">View All Notices</a>
        </div>
        <div class="panel panel-accent-blue">
            <div class="panel-title">&#128197; Upcoming Exams</div>
            {% if exam_schedules %}{% for exam in exam_schedules %}<div class="exam-item"><h4>{{ exam.subject_name }}</h4><p>{{ exam.exam_date }} | {{ exam.exam_time }}</p></div>{% endfor %}
            {% else %}<p class="empty-state">No upcoming exams scheduled.</p>{% endif %}
            <a href="/teacher/exam-schedule" class="btn-outline">View Full Schedule</a>
        </div>
    </div>

    <div class="quick-actions-bar">
        <span class="qa-label">&#9889; Quick Actions</span>
        <a href="/teacher/attendance" class="qa-btn qa-btn-orange">&#128221; Mark Attendance</a>
        <a href="/teacher/grades" class="qa-btn qa-btn-teal">&#128202; Enter Grades</a>
        <a href="/teacher/students" class="qa-btn qa-btn-ghost">&#128101; View Students</a>
        <a href="/teacher/study-materials" class="qa-btn qa-btn-ghost">&#128218; Study Materials</a>
        <a href="/teacher/leave-applications" class="qa-btn qa-btn-ghost">&#128203; Leave Applications</a>
        <a href="/teacher/profile" class="qa-btn qa-btn-ghost">&#128100; My Profile</a>
    </div>
</div>
{% endblock %}
"@

# Get project path
$projectPath = "C:\Users\mansi\OneDrive\Documents\ERP_SYSTEM_PROJECT"

# Write base.html
$basePath = Join-Path $projectPath "app\templates\teacher\base.html"
$baseContent | Out-File -FilePath $basePath -Encoding UTF8 -Force
Write-Host "base.html written successfully!"

# Write dashboard.html
$dashboardPath = Join-Path $projectPath "app\templates\teacher\dashboard.html"
$dashboardContent | Out-File -FilePath $dashboardPath -Encoding UTF8 -Force
Write-Host "dashboard.html written successfully!"

Write-Host ""
Write-Host "SUCCESS! Both teacher template files have been written." -ForegroundColor Green

