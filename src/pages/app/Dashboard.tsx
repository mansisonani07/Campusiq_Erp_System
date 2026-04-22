import { useEffect, useState } from 'react';
import { BarChart, Donut, LineChart, ProgressBar, Sparkline } from '../../components/Charts';
import Tilt from '../../components/Tilt';
import { useSession } from '../../lib/session';
import { api } from '../../lib/api';
import { GraduationCap, BookOpen, CreditCard, Bell, TrendingUp, BookMarked, CheckCircle2, AlertTriangle, ArrowUpRight, Clock, ClipboardList, FileText, Sparkles, Activity, Target, Users, Calendar, MessageSquare, ShieldCheck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { can, roleLabel } from '../../lib/rbac';

export default function Dashboard() {
  const { user } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, n, a, e, t] = await Promise.all([
          api<any>('/api/stats'), api<any[]>('/api/notifications'), api<any[]>('/api/assignments'), api<any[]>('/api/exams'), api<any[]>('/api/timetable'),
        ]);
        setStats(s);
        setNotifs(n);
        // RBAC data scoping for personal categories
        const scopedAssignments = (user && user.role !== 'admin' && user.role !== 'faculty' && user.studentId)
          ? a.filter((x: any) => !x.student_id || x.student_id === user.studentId)
          : a;
        setAssignments(scopedAssignments);
        setExams(e);
        setTimetable(t);
        // Personal approval requests (students/parents)
        if (user && (user.role === 'student' || user.role === 'parent')) {
          try {
            const wfs = await api<any[]>('/api/workflows');
            setMyRequests(wfs.filter((w: any) => w.requester_name?.toLowerCase() === user.name.toLowerCase()));
          } catch { }
        }
      } catch (err) { console.error(err); }
    })();
  }, [user]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dayIdx = new Date().getDay();
  const todayClasses = timetable.filter(t => t.day_index === (dayIdx === 0 ? 6 : dayIdx - 1));

  if (!user) return null;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Hero banner */}
      <Tilt max={4} scale={1} perspective={1400} glare={false} className="rounded-3xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-700 text-white p-7 lg:p-9 mb-6 elev-3">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl float-slow" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl float-slow" style={{ animationDelay: '2s' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-white/80 font-bold flex items-center gap-2"><Sparkles size={12} /> {today}</div>
              <h1 className="heading-display text-3xl lg:text-[2.5rem] mt-3">Welcome back, {user.name.split(' ')[0]}.</h1>
              <p className="text-white/90 mt-1.5 text-[14.5px]">
                {user.role === 'student' ? `${user.program} · Semester ${user.semester} · Roll ${user.studentId}` :
                  user.role === 'faculty' ? `${user.department} department · 3 active courses` :
                    user.role === 'parent' ? `Parent dashboard · monitoring ward ${user.studentId}` :
                      'Institution-wide super-admin access'}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 chip bg-white/20 text-white border border-white/30 backdrop-blur-md">
                <ShieldCheck size={10} /> Role-based view · {roleLabel(user.role)}
              </div>
            </div>
            <div className="flex gap-6 flex-wrap">
              {[
                { v: todayClasses.length || 0, l: "Today's classes" },
                { v: assignments.filter(a => a.status === 'pending').length, l: 'Pending tasks' },
                { v: notifs.filter(n => !n.is_read).length, l: 'Unread alerts' },
              ].map(x => (
                <div key={x.l}>
                  <div className="heading-display text-3xl lg:text-4xl">{x.v}</div>
                  <div className="text-[10.5px] text-white/80 uppercase tracking-widest font-bold">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Tilt>

      {/* Personal request status (students/parents) */}
      {(user.role === 'student' || user.role === 'parent') && myRequests.length > 0 && (
        <div className="mb-6 space-y-2 stagger">
          {myRequests.filter((r: any) => r.status !== 'approved').slice(0, 3).map((r: any) => {
            const pending = r.status === 'pending';
            const rejected = r.status === 'rejected';
            return (
              <Link key={r.id} to="/app/workflows" className={`block rounded-2xl p-4 flex items-center gap-3 hover-lift card-gradient-border ${pending ? 'bg-amber-500/10 border border-amber-500/25' :
                rejected ? 'bg-rose-500/10 border border-rose-500/25' :
                  'bg-cyan-500/10 border border-cyan-500/25'
                }`}>
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md shrink-0 ${pending ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                  rejected ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                    'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}>
                  {pending ? <Clock size={17} /> : rejected ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">
                    {pending ? 'Awaiting admin review' : rejected ? 'Request rejected' : r.request_type}
                    <span className="text-slate-500 font-normal"> · {r.title}</span>
                  </div>
                  <div className="text-[11.5px] text-slate-500 mono mt-0.5">#{r.reference_no} · {r.request_type}</div>
                </div>
                <ArrowUpRight size={15} className="text-slate-400 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick stats with 3D tilt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        {[
          { label: 'Students', value: stats?.students ?? '—', icon: GraduationCap, trend: '+4.8%', color: 'from-cyan-500 to-teal-500', spark: [12, 18, 14, 22, 26, 24, 32] },
          { label: 'Faculty', value: stats?.faculty ?? '—', icon: BookOpen, trend: '+1.2%', color: 'from-blue-500 to-indigo-600', spark: [8, 10, 11, 10, 12, 13, 14] },
          { label: 'Active courses', value: stats?.courses ?? '—', icon: BookMarked, trend: 'steady', color: 'from-violet-500 to-purple-600', spark: [20, 22, 20, 24, 24, 26, 28] },
          { label: 'Fees collected', value: stats ? '₹' + (stats.feesPaid / 100000).toFixed(1) + 'L' : '—', icon: CreditCard, trend: stats?.feesDue ? '₹' + (stats.feesDue / 100000).toFixed(1) + 'L due' : '—', color: 'from-emerald-500 to-teal-600', spark: [2, 4, 7, 10, 12, 16, 22] },
        ].map((s, i) => (
          <Tilt key={i} max={10} scale={1.02} className="rounded-2xl">
            <div className="glass-card rounded-2xl p-5 card-gradient-border relative overflow-hidden">
              <div className="flex items-start justify-between tilt-inner">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg`}><s.icon size={18} /></div>
                <div className="chip text-[9.5px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20"><TrendingUp size={9} />{s.trend}</div>
              </div>
              <div className="mt-4 flex items-end justify-between tilt-inner">
                <div>
                  <div className="heading-display text-3xl text-[var(--text-primary)]">{s.value}</div>
                  <div className="text-[10.5px] uppercase tracking-widest text-slate-500 font-bold mt-1">{s.label}</div>
                </div>
                <div className="text-cyan-500"><Sparkline data={s.spark} /></div>
              </div>
            </div>
          </Tilt>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Tilt max={4} scale={1} perspective={1600} glare className="lg:col-span-2 rounded-2xl">
          <div className="glass-card rounded-2xl p-6 hover-glow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[13.5px] font-bold text-[var(--text-primary)]">Attendance trend · last 8 weeks</div>
                <div className="text-xs text-slate-500 mt-0.5">Class-wide percentage with weekly rolling average</div>
              </div>
              <div className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 pulse-dot" /> Live</div>
            </div>
            <div className="text-[var(--text-secondary)]">
              <LineChart data={[84, 88, 86, 91, 89, 93, 92, 95]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']} height={220} />
            </div>
          </div>
        </Tilt>

        <Tilt max={6} scale={1.01} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13.5px] font-bold text-[var(--text-primary)]">Fee collection</div>
              <div className="chip bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">August</div>
            </div>
            <div className="flex items-center justify-center py-2">
              <Donut value={stats?.feesPaid || 120000} total={(stats?.feesPaid || 0) + (stats?.feesDue || 40000)} label="Collected" sub={`₹${((stats?.feesPaid || 0) / 100000).toFixed(1)}L / ₹${(((stats?.feesPaid || 0) + (stats?.feesDue || 0)) / 100000).toFixed(1)}L`} />
            </div>
            <div className="mt-3 space-y-3">
              {[
                { l: 'Tuition', v: 68, c: 'from-cyan-500 to-teal-500' },
                { l: 'Hostel', v: 41, c: 'from-blue-500 to-indigo-600' },
                { l: 'Transport', v: 86, c: 'from-violet-500 to-purple-600' },
              ].map(i => (
                <div key={i.l}>
                  <div className="flex justify-between text-[11.5px] mb-1.5"><span className="font-bold text-[var(--text-secondary)]">{i.l}</span><span className="font-bold text-slate-500">{i.v}%</span></div>
                  <ProgressBar value={i.v} color={i.c} />
                </div>
              ))}
            </div>
          </div>
        </Tilt>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: "Today's schedule", icon: Clock, color: 'text-cyan-500', to: '/app/timetable',
            items: (todayClasses.length ? todayClasses : [
              { subject: 'Data Structures', start_time: '09:00', end_time: '10:00', room: 'CS-201', faculty: 'Dr. Meera Shankar' },
              { subject: 'Operating Systems', start_time: '10:15', end_time: '11:15', room: 'CS-104', faculty: 'Prof. Arjun Raman' },
              { subject: 'Workshop Lab', start_time: '14:00', end_time: '16:00', room: 'Lab-3', faculty: 'Dr. Nila Krishnan' },
            ]).slice(0, 5),
            render: (c: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 link-row">
                <div className="w-1 h-11 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] truncate">{c.subject}</div>
                  <div className="text-[11px] text-slate-500 truncate">{c.faculty} · {c.room}</div>
                </div>
                <div className="text-[11px] mono text-slate-500 whitespace-nowrap">{c.start_time}–{c.end_time}</div>
              </div>
            ),
          },
          {
            title: 'Assignments', icon: FileText, color: 'text-blue-500', to: '/app/assignments',
            items: assignments.slice(0, 5),
            render: (a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 link-row">
                <div className={`w-9 h-9 rounded-lg shrink-0 ${a.status === 'submitted' ? 'bg-emerald-500/15 text-emerald-600' : a.status === 'pending' ? 'bg-amber-500/15 text-amber-600' : 'bg-rose-500/15 text-rose-600'} flex items-center justify-center`}>
                  {a.status === 'submitted' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] truncate">{a.title}</div>
                  <div className="text-[11px] text-slate-500">{a.course_code} · due {new Date(a.due_date).toLocaleDateString()}</div>
                </div>
                <div className={`chip ${a.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>{a.status}</div>
              </div>
            ),
          },
          {
            title: 'Notifications', icon: Bell, color: 'text-rose-500', to: '/app/notifications',
            items: notifs.slice(0, 5),
            render: (n: any) => (
              <div key={n.id} className="p-2.5 link-row">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.priority === 'high' ? 'bg-rose-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'} ${!n.is_read && 'pulse-dot'}`} />
                  <div className="font-bold text-[13px] flex-1 truncate">{n.title}</div>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 pl-3.5">{n.body}</div>
              </div>
            ),
          },
        ].map((panel) => {
          const Icon = panel.icon;
          return (
            <Tilt key={panel.title} max={5} scale={1.005} className="rounded-2xl">
              <div className="glass-card rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[13.5px] font-bold text-[var(--text-primary)] flex items-center gap-2"><Icon size={14} className={panel.color} /> {panel.title}</div>
                  <Link to={panel.to} className="text-[11.5px] text-cyan-600 font-bold inline-flex items-center gap-0.5 hover:underline">View <ArrowUpRight size={11} /></Link>
                </div>
                <div className="space-y-1.5">{panel.items.map((it: any, i: number) => panel.render(it, i))}</div>
              </div>
            </Tilt>
          );
        })}
      </div>

      {/* Grade distribution + upcoming exams */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Tilt max={4} scale={1.005} className="lg:col-span-2 rounded-2xl">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[13.5px] font-bold text-[var(--text-primary)]">Grade distribution</div>
                <div className="text-xs text-slate-500 mt-0.5">Last semester across all courses</div>
              </div>
              <div className="chip bg-blue-500/10 text-blue-700 border border-blue-500/20">Fall 2024</div>
            </div>
            <div className="text-[var(--text-secondary)]">
              <BarChart data={[18, 42, 78, 112, 98, 64, 32, 14]} labels={['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F']} height={220} />
            </div>
          </div>
        </Tilt>
        <Tilt max={6} scale={1.01} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13.5px] font-bold text-[var(--text-primary)] flex items-center gap-2"><Target size={14} className="text-violet-500" /> Upcoming exams</div>
              <Link to="/app/exams" className="text-[11.5px] text-cyan-600 font-bold inline-flex items-center gap-0.5 hover:underline">View <ArrowUpRight size={11} /></Link>
            </div>
            <div className="space-y-2.5">
              {exams.slice(0, 5).map((e: any) => (
                <div key={e.id} className="p-3 rounded-xl bg-[var(--bg-inset)]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[13px]">{e.subject}</div>
                    <div className="text-[10px] text-slate-500 mono">{e.exam_date}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{e.exam_type} · {e.duration_min}m · {e.room}</div>
                </div>
              ))}
            </div>
          </div>
        </Tilt>
      </div>

      {/* Quick access tiles */}
      <div className="glass-card rounded-2xl p-6">
        <div className="text-[13.5px] font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Activity size={14} className="text-cyan-500" /> Quick access</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {([
            { to: '/app/attendance', l: 'Attendance', i: ClipboardList, c: 'from-cyan-500 to-teal-500', res: 'attendance' as const },
            { to: '/app/timetable', l: 'Timetable', i: Calendar, c: 'from-blue-500 to-indigo-600', res: 'timetable' as const },
            { to: '/app/fees', l: 'Fees', i: CreditCard, c: 'from-emerald-500 to-teal-600', res: 'fees' as const },
            { to: '/app/library', l: 'Library', i: BookOpen, c: 'from-violet-500 to-purple-600', res: 'library' as const },
            { to: '/app/lms', l: 'Learning', i: GraduationCap, c: 'from-amber-500 to-orange-500', res: 'lms' as const },
            { to: '/app/messages', l: 'Messages', i: MessageSquare, c: 'from-rose-500 to-pink-600', res: 'messages' as const },
          ]).filter(q => can(user.role, q.res, 'view')).map(q => {
            const I = q.i;
            return (
              <Tilt key={q.to} max={12} scale={1.03} className="rounded-xl">
                <Link to={q.to} className="block rounded-xl p-4 bg-[var(--bg-inset)] card-gradient-border">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${q.c} text-white flex items-center justify-center mb-3 shadow-md`}><I size={18} /></div>
                  <div className="text-[13px] font-bold">{q.l}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">Open module →</div>
                </Link>
              </Tilt>
            );
          })}
        </div>
      </div>
    </div>
  );
}
