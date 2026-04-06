#!/usr/bin/env python3
"""Fix teacher template files - writes directly without Blackbox interference"""
import os

base_content = '''{% extends "base.html" %}
{% block title %}Teacher Portal - CampusIQ{% endblock %}
{% block navbar %}
<nav class="navbar" style="background:rgba(6,13,24,0.98);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 1px 0 rgba(255,255,255,0.07);border-bottom:1px solid rgba(255,255,255,0.06);padding:0 24px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:3px;z-index:100;">
  <div class="nav-brand">
    <a href="/teacher/dashboard" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#0f766e,#14b8a6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(20,184,166,0.3);">&#127891;</div>
      <div>
        <div style="font-size:16px;font-weight:800;color:#fff;letter-spacing:-0.3px;line-height:1.1;">CampusIQ</div>
        <div style="font-size:9px;color:#2dd4bf;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Smart Campus</div>
      </div>
    </a>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="background:rgba(249,115,22,0.15);color:#fb923c;padding:5px 14px;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:1.5px;border:1px solid rgba(249,115,22,0.25);">TEACHER</span>
    <span style="color:rgba(255,255,255,0.65);font-size:14px;font-weight:500;">{{ user.name }}</span>
    <a href="/logout" style="background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:7px 16px;text-decoration:none;font-size:13px;font-weight:600;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">Logout</a>
  </div>
</nav>
{% endblock %}
{% block sidebar %}
<aside class="app-sidebar panel" aria-label="Primary menu" style="background:linear-gradient(180deg,#090f1c 0%,#060d18 100%);border-right:1px solid rgba(255,255,255,0.06);padding:20px 0;">
  <div style="padding:0 16px 14px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.05);">
    <div style="color:rgba(255,255,255,0.2);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Menu</div>
  </div>
  <nav class="app-menu">
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
body{font-family:'DM Sans',sans-serif!important;background:#060d18!important;color:#e8edf5;}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#f97316,#facc15,#14b8a6,#facc15,#f97316);background-size:200% 100%;animation:tbs 3s linear infinite;z-index:9999;}
@keyframes tbs{0%{background-position:200% 0}100%{background-position:-200% 0}}
.app-menu-link{display:flex!important;align-items:center;gap:10px;color:rgba(255,255,255,0.38)!important;padding:11px 18px!important;border-radius:10px!important;margin:2px 10px!important;transition:all 0.2s!important;font-size:13.5px!important;font-weight:500!important;text-decoration:none!important;border-left:3px solid transparent!important;}
.app-menu-link:hover{background:rgba(20,184,166,0.08)!important;color:rgba(255,255,255,0.8)!important;transform:translateX(3px)!important;border-left-color:rgba(20,184,166,0.4)!important;}
.app-menu-link.active{background:linear-gradient(135deg,rgba(249,115,22,0.14),rgba(20,184,166,0.08))!important;color:#fff!important;font-weight:700!important;border-left:3px solid #f97316!important;}
.main-content{background:#060d18!important;min-height:100vh;}
.app-layout,.app-body,main{background:#060d18!important;}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#060d18}::-webkit-scrollbar-thumb{background:linear-gradient(#14b8a6,#f97316);border-radius:3px}
</style>
{% endblock %}
'''

dashboard_content = '''{% extends "teacher/base.html" %}
{% block title %}Teacher Dashboard — CampusIQ{% endblock %}
{% block content %}
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;}
.db{font-family:'DM Sans',sans-serif;background:#060d18;min-height:100vh;padding:24px 28px 40px;color:#e8edf5;background-image:radial-gradient(ellipse 600px 400px at 0% 0%,rgba(20,184,166,0.07) 0%,transparent 70%),radial-gradient(ellipse 500px 500px at 100% 100%,rgba(249,115,22,0.05) 0%,transparent 70%);}
.db-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);}
.db-header h1{font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.4px;}
.db-header p{font-size:13px;color:rgba(255,255,255,0.4);margin-top:3px;}
.db-header-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.hchip{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;}
.hc-t{background:rgba(20,184,166,0.12);color:#2dd4bf;border:1px solid rgba(20,184,166,0.2);}
.hc-o{background:rgba(249,115,22,0.12);color:#fb923c;border:1px solid rgba(249,115,22,0.2);}
.hc-y{background:rgba(234,179,8,0.12);color:#facc15;border:1px solid rgba(234,179,8,0.2);}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
.sbox{border-radius:14px;padding:20px 22px;position:relative;overflow:hidden;transition:transform 0.2s;cursor:default;}
.sbox:hover{transform:translateY(-3px);}
.sb1{background:linear-gradient(135deg,#0f2744,#1a3a5c);border:1px solid rgba(59,130,246,0.2);}
.sb2{background:linear-gradient(135deg,#064437,#0a6652);border:1px solid rgba(20,184,166,0.2);}
.sb3{background:linear-gradient(135deg,#4a1010,#7a1f1f);border:1px solid rgba(239,68,68,0.2);}
.sb4{background:linear-gradient(135deg,#3d2800,#6b4400);border:1px solid rgba(234,179,8,0.2);}
.snum{font-size:40px;font-weight:700;color:#fff;letter-spacing:-2px;line-height:1;margin:8px 0 6px;font-family:'DM Mono',monospace;}
.slbl{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45);}
.ssub{font-size:12px;color:rgba(255,255,255,0.3);margin-top:6px;}
.sico{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;}
.si-b{background:rgba(59,130,246,0.15);}
.si-t{background:rgba(20,184,166,0.15);}
.si-r{background:rgba(239,68,68,0.15);}
.si-g{background:rgba(234,179,8,0.15);}
.abar{background:rgba(255,255,255,0.06);border-radius:4px;height:4px;margin-top:10px;overflow:hidden;}
.afill{height:100%;border-radius:4px;background:linear-gradient(90deg,#2dd4bf,#14b8a6);}
.mgrid{display:grid;grid-template-columns:1.2fr 0.8fr;gap:20px;margin-bottom:20px;}
.bgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;}
.panel{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:22px 24px;}
.phd{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.phd h2{font-size:14px;font-weight:700;color:#fff;}
.phd a{font-size:12px;color:#2dd4bf;text-decoration:none;font-weight:500;opacity:0.8;}
.phd a:hover{opacity:1;}
.ptag{font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;}
.pt-o{background:rgba(249,115,22,0.15);color:#fb923c;}
.pt-t{background:rgba(20,184,166,0.15);color:#2dd4bf;}
.pt-b{background:rgba(59,130,246,0.15);color:#93c5fd;}
.dbt{width:100%;border-collapse:collapse;}
.dbt th{text-align:left;padding:0 10px 10px;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.25);border-bottom:1px solid rgba(255,255,255,0.06);}
.dbt td{padding:11px 10px;font-size:13px;color:rgba(255,255,255,0.75);border-bottom:1px solid rgba(255,255,255,0.04);}
.dbt tr:last-child td{border-bottom:none;}
.dbt tr:hover td{background:rgba(255,255,255,0.02);}
.tdn{color:rgba(255,255,255,0.9)!important;font-weight:600!important;}
.tdb{color:#f87171!important;font-weight:700!important;font-family:'DM Mono',monospace;}
.rchip{background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:5px;font-size:11px;font-family:'DM Mono',monospace;color:rgba(255,255,255,0.5);}
.lcard{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:11px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;transition:all 0.2s;}
.lcard:hover{background:rgba(255,255,255,0.05);transform:translateX(2px);}
.lcard:last-child{margin-bottom:0;}
.lcn{font-size:14px;font-weight:600;color:#fff;}
.lcd{font-size:12px;color:rgba(255,255,255,0.4);margin-top:3px;font-family:'DM Mono',monospace;}
.lca{display:flex;gap:8px;}
.lap{background:rgba(20,184,166,0.15);color:#2dd4bf;border:1px solid rgba(20,184,166,0.25);border-radius:7px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.lap:hover{background:rgba(20,184,166,0.25);}
.lrj{background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.2);border-radius:7px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.lrj:hover{background:rgba(239,68,68,0.22);}
.nrow{display:flex;gap:14px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,0.05);align-items:flex-start;}
.nrow:last-child{border-bottom:none;}
.ndot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;}
.nd-o{background:#fb923c;box-shadow:0 0 8px rgba(249,115,22,0.5);}
.nd-b{background:#60a5fa;box-shadow:0 0 8px rgba(59,130,246,0.5);}
.nd-t{background:#2dd4bf;box-shadow:0 0 8px rgba(20,184,166,0.5);}
.ntit{font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:3px;}
.nbod{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;}
.ntim{font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px;font-family:'DM Mono',monospace;}
.erow{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.erow:last-child{border-bottom:none;}
.edbox{min-width:46px;height:46px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
.eday{font-size:16px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;line-height:1;}
.emon{font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;}
.esubj{font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);}
.emeta{font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;}
.ebadge{margin-left:auto;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;white-space:nowrap;}
.eb-m{background:rgba(59,130,246,0.15);color:#93c5fd;}
.qastrip{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px 24px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.qalbl{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-right:6px;}
.qabtn{padding:10px 18px;border-radius:9px;font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;display:flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;border:none;cursor:pointer;}
.qa-p{background:linear-gradient(135deg,#f97316,#fb923c);color:white;box-shadow:0 4px 14px rgba(249,115,22,0.3);}
.qa-p:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(249,115,22,0.4);}
.qa-s{background:linear-gradient(135deg,#0f766e,#14b8a6);color:white;box-shadow:0 4px 14px rgba(20,184,166,0.2);}
.qa-s:hover{transform:translateY(-2px);}
.qa-g{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.08);}
.qa-g:hover{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.85);transform:translateY(-1px);}
.eg{color:#4ade80;font-size:13px;font-weight:500;padding:10px 0;}
.en{color:rgba(255,255,255,0.25);font-size:13px;padding:10px 0;}
.btn-p{background:linear-gradient(135deg,#f97316,#fb923c);color:white;border:none;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:7px;margin-top:16px;transition:all 0.2s;box-shadow:0 4px 14px rgba(249,115,22,0.3);font-family:'DM Sans',sans-serif;}
.btn-p:hover{transform:translateY(-2px);}
.btn-s{background:transparent;color:#14b8a6;border:1.5px solid #14b8a6;border-radius:9px;padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:7px;margin-top:16px;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.btn-s:hover{background:#14b8a6;color:#060d18;}
@media(max-width:1024px){.stat-row{grid-template-columns:repeat(2,1fr)}.mgrid,.bgrid{grid-template-columns:1fr}}
@media(max-width:600px){.db{padding:16px}.db-header{flex-direction:column;align-items:flex-start;gap:12px}}
</style>
<div class="db">
  <div class="db-header">
    <div>
      <h1>&#128075; Good morning, {{ user.name }}!</h1>
      <p>{{ branch.name if branch else 'Branch not assigned' }} &nbsp;&middot;&nbsp; Semester {{ semester.semester_number if semester else '-' }} &nbsp;&middot;&nbsp; Today's overview</p>
    </div>
    <div class="db-header-right">
      <span class="hchip hc-t">&#128101; {{ student_count }} Students</span>
      <span class="hchip hc-o">&#9203; {{ pending_leaves_count }} Leaves</span>
      <span class="hchip hc-y">&#9989; Attendance Open</span>
    </div>
  </div>
  <div class="stat-row">
    <div class="sbox sb1"><div class="sico si-b">&#128101;</div><div class="slbl">Total Students</div><div class="snum">{{ student_count }}</div><div class="ssub">Enrolled this semester</div></div>
    <div class="sbox sb2"><div class="sico si-t">&#9989;</div><div class="slbl">Present Today</div><div class="snum">{{ present_today }}</div><div class="abar"><div class="afill" style="width:{% if student_count > 0 %}{{ (present_today / student_count * 100)|int }}{% else %}0{% endif %}%"></div></div></div>
    <div class="sbox sb3"><div class="sico si-r">&#10060;</div><div class="slbl">Absent Today</div><div class="snum">{{ absent_today }}</div><div class="ssub">Students missing class</div></div>
    <div class="sbox sb4"><div class="sico si-g">&#9203;</div><div class="slbl">Not Marked</div><div class="snum">{{ not_marked_today }}</div><div class="ssub">Attendance pending</div></div>
  </div>
  <div class="mgrid">
    <div class="panel">
      <div class="phd"><h2>&#9888;&#65039; Low Attendance Students</h2><a href="/teacher/students">View all &rarr;</a></div>
      {% if low_attendance %}
      <table class="dbt">
        <thead><tr><th>Roll No</th><th>Student Name</th><th>Attendance %</th><th>Status</th></tr></thead>
        <tbody>{% for s in low_attendance %}<tr><td><span class="rchip">{{ s.roll_no }}</span></td><td class="tdn">{{ s.name }}</td><td class="tdb">{{ s.pct }}%</td><td>{% if s.pct < 50 %}<span class="ptag pt-o">Critical</span>{% else %}<span class="ptag pt-b">Warning</span>{% endif %}</td></tr>{% endfor %}</tbody>
      </table>
      {% else %}<p class="eg">&#10003; All students have attendance above 75%</p>{% endif %}
      <a href="/teacher/students" class="btn-p">&#128101; View All Students</a>
    </div>
    <div class="panel">
      <div class="phd"><h2>&#128203; Leave Requests</h2><span class="ptag pt-o">{{ pending_leaves_count }} Pending</span></div>
      {% if pending_leaves %}{% for leave in pending_leaves %}<div class="lcard"><div><div class="lcn">{{ leave.student_name }}</div><div class="lcd">{{ leave.from_date }} &rarr; {{ leave.to_date }}</div></div><div class="lca"><button class="lap">Approve</button><button class="lrj">Reject</button></div></div>{% endfor %}{% else %}<p class="eg">&#10003; No pending leave requests</p>{% endif %}
      <a href="/teacher/leave-applications" class="btn-s">&#128203; Manage All Leaves</a>
    </div>
  </div>
  <div class="bgrid">
    <div class="panel">
      <div class="phd"><h2>&#128226; Recent Notices</h2><a href="/teacher/notices">See all &rarr;</a></div>
      {% if notices %}{% for notice in notices %}<div class="nrow"><div class="ndot {% if loop.index == 1 %}nd-o{% elif loop.index == 2 %}nd-b{% else %}nd-t{% endif %}"></div><div><div class="ntit">{{ notice.title }}</div><div class="nbod">{{ notice.content[:90] }}{% if notice.content|length > 90 %}...{% endif %}</div><div class="ntim">Recent</div></div></div>{% endfor %}{% else %}<p class="en">No recent notices posted.</p>{% endif %}
      <a href="/teacher/notices" class="btn-p">&#128226; View All Notices</a>
    </div>
    <div class="panel">
      <div class="phd"><h2>&#128197; Upcoming Exams</h2><a href="/teacher/exam-schedule">Full schedule &rarr;</a></div>
      {% if exam_schedules %}{% for exam in exam_schedules %}<div class="erow"><div class="edbox"><div class="eday">{{ exam.exam_date.split('-')[2] if '-' in exam.exam_date|string else '--' }}</div><div class="emon">{{ exam.exam_date.split('-')[1] if '-' in exam.exam_date|string else '' }}</div></div><div><div class="esubj">{{ exam.subject_name }}</div><div class="emeta">{{ exam.exam_time }}</div></div><span class="ebadge eb-m">Exam</span></div>{% endfor %}{% else %}<p class="en">No upcoming exams scheduled.</p>{% endif %}
      <a href="/teacher/exam-schedule" class="btn-s">&#128197; View Full Schedule</a>
    </div>
  </div>
  <div class="qastrip">
    <span class="qalbl">&#9889; Quick Actions</span>
    <a href="/teacher/attendance" class="qabtn qa-p">&#128221; Mark Attendance</a>
    <a href="/teacher/grades" class="qabtn qa-s">&#128202; Enter Grades</a>
    <a href="/teacher/students" class="qabtn qa-g">&#128101; Students</a>
    <a href="/teacher/study-materials" class="qabtn qa-g">&#128218; Materials</a>
    <a href="/teacher/leave-applications" class="qabtn qa-g">&#128203; Leaves</a>
    <a href="/teacher/notices" class="qabtn qa-g">&#128226; Notices</a>
    <a href="/teacher/profile" class="qabtn qa-g">&#128100; Profile</a>
  </div>
</div>
{% endblock %}
'''

# Get project path
project_path = os.path.dirname(os.path.abspath(__file__))
teacher_path = os.path.join(project_path, 'app', 'templates', 'teacher')

# Write base.html
base_path = os.path.join(teacher_path, 'base.html')
with open(base_path, 'w', encoding='utf-8') as f:
    f.write(base_content)
print(f'✓ Written: {base_path}')

# Write dashboard.html
dashboard_path = os.path.join(teacher_path, 'dashboard.html')
with open(dashboard_path, 'w', encoding='utf-8') as f:
    f.write(dashboard_content)
print(f'✓ Written: {dashboard_path}')

print('\nSUCCESS!')
