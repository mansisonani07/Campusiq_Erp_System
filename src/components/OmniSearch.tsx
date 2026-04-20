import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, CornerDownLeft, ArrowUp, ArrowDown, Users, GraduationCap, BookOpen, ClipboardList, Calendar, CreditCard, FileText, Library, Building2, Bus, Bell, MessageSquare, Workflow, BarChart3, FolderOpen, Briefcase, DollarSign, Settings, Home, UserCircle2, ShieldCheck, Lock, type LucideIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { can, canSeeRecord, searchableGroups, type RecordGroup, type Resource } from '../lib/rbac';

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  group: RecordGroup;
  groupLabel: string;
  icon: LucideIcon;
  color: string;
  to: string;
  keywords?: string[];
  /** Ownership metadata — used for record-level isolation */
  ownerStudentId?: string;
  recipient?: string;
  sender?: string;
  /** Resource required to view the destination page */
  resource?: Resource;
}

const GROUP_ORDER: RecordGroup[] = ['pages', 'students', 'faculty', 'courses', 'admissions', 'exams', 'assignments', 'books', 'fees', 'payroll', 'documents', 'rooms', 'routes', 'workflows', 'notifications', 'messages', 'timetable'];
const GROUP_LABELS: Record<RecordGroup, string> = {
  pages: 'Pages',
  students: 'Students',
  faculty: 'Faculty',
  courses: 'Courses',
  admissions: 'Admissions',
  exams: 'Exams',
  assignments: 'Assignments',
  books: 'Library',
  fees: 'Fees',
  payroll: 'Payroll',
  documents: 'Documents',
  rooms: 'Hostel',
  routes: 'Transport',
  workflows: 'Approvals',
  notifications: 'Notifications',
  messages: 'Messages',
  timetable: 'Timetable',
};

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-cyan-500/25 text-cyan-700 dark:text-cyan-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function OmniSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { user } = useSession();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pages available to this role — always the authoritative nav list
  const pageItems: SearchItem[] = useMemo(() => {
    if (!user) return [];
    const all: Array<Omit<SearchItem, 'group' | 'groupLabel'> & { resource: Resource }> = [
      { id: 'p:dashboard', title: 'Dashboard', subtitle: 'Overview of everything', icon: Home, color: 'from-cyan-500 to-teal-500', to: '/app/dashboard', resource: 'dashboard', keywords: ['home'] },
      { id: 'p:timetable', title: 'Timetable', subtitle: 'Weekly schedule', icon: Calendar, color: 'from-blue-500 to-indigo-600', to: '/app/timetable', resource: 'timetable' },
      { id: 'p:attendance', title: 'Attendance', subtitle: 'Session-wise tracking', icon: ClipboardList, color: 'from-emerald-500 to-teal-600', to: '/app/attendance', resource: 'attendance' },
      { id: 'p:assignments', title: 'Assignments', subtitle: 'Submissions & deadlines', icon: FileText, color: 'from-rose-500 to-pink-600', to: '/app/assignments', resource: 'assignments' },
      { id: 'p:exams', title: 'Exams & Grades', subtitle: 'Schedule & results', icon: GraduationCap, color: 'from-amber-500 to-orange-500', to: '/app/exams', resource: 'exams' },
      { id: 'p:lms', title: 'Learning Portal', subtitle: 'Videos & quizzes', icon: BookOpen, color: 'from-violet-500 to-purple-600', to: '/app/lms', resource: 'lms' },
      { id: 'p:fees', title: 'Fees', subtitle: 'Payments & receipts', icon: CreditCard, color: 'from-emerald-500 to-teal-600', to: '/app/fees', resource: 'fees' },
      { id: 'p:library', title: 'Library', subtitle: 'Books & e-resources', icon: Library, color: 'from-sky-500 to-blue-600', to: '/app/library', resource: 'library' },
      { id: 'p:hostel', title: 'Hostel', subtitle: 'Rooms & mess', icon: Building2, color: 'from-fuchsia-500 to-rose-500', to: '/app/hostel', resource: 'hostel' },
      { id: 'p:transport', title: 'Transport', subtitle: 'Routes & drivers', icon: Bus, color: 'from-lime-500 to-emerald-500', to: '/app/transport', resource: 'transport' },
      { id: 'p:students', title: 'Students', subtitle: 'Directory', icon: Users, color: 'from-cyan-500 to-teal-500', to: '/app/students', resource: 'students' },
      { id: 'p:faculty', title: 'Faculty & HR', subtitle: 'Teaching staff', icon: Briefcase, color: 'from-blue-500 to-indigo-600', to: '/app/faculty', resource: 'faculty' },
      { id: 'p:courses', title: 'Courses', subtitle: 'Academic catalog', icon: BookOpen, color: 'from-violet-500 to-purple-600', to: '/app/courses', resource: 'courses' },
      { id: 'p:admissions', title: 'Admissions', subtitle: 'Applicant pipeline', icon: GraduationCap, color: 'from-cyan-500 to-teal-500', to: '/app/admissions', resource: 'admissions' },
      { id: 'p:payroll', title: 'Payroll', subtitle: 'Salary & disbursement', icon: DollarSign, color: 'from-amber-500 to-orange-500', to: '/app/payroll', resource: 'payroll' },
      { id: 'p:workflows', title: 'Approvals', subtitle: 'Workflow queue', icon: Workflow, color: 'from-orange-500 to-rose-500', to: '/app/workflows', resource: 'workflows' },
      { id: 'p:account_approvals', title: 'Account Approvals', subtitle: 'Registrations & profile changes', icon: ShieldCheck, color: 'from-rose-500 to-orange-500', to: '/app/account-approvals', resource: 'account_approvals' },
      { id: 'p:analytics', title: 'Analytics', subtitle: 'Institution KPIs', icon: BarChart3, color: 'from-teal-500 to-blue-600', to: '/app/analytics', resource: 'analytics' },
      { id: 'p:reports', title: 'Reports', subtitle: 'Generate & export', icon: FileText, color: 'from-slate-500 to-slate-700', to: '/app/reports', resource: 'reports' },
      { id: 'p:notifications', title: 'Notifications', subtitle: 'Alerts & broadcasts', icon: Bell, color: 'from-rose-500 to-pink-600', to: '/app/notifications', resource: 'notifications' },
      { id: 'p:messages', title: 'Messages', subtitle: 'Conversations', icon: MessageSquare, color: 'from-violet-500 to-purple-600', to: '/app/messages', resource: 'messages' },
      { id: 'p:documents', title: 'Documents', subtitle: 'Certificates & records', icon: FolderOpen, color: 'from-blue-500 to-indigo-600', to: '/app/documents', resource: 'documents' },
      { id: 'p:settings', title: 'Settings', subtitle: 'Preferences & security', icon: Settings, color: 'from-slate-500 to-slate-700', to: '/app/settings', resource: 'settings' },
    ];
    return all
      .filter(p => can(user.role, p.resource, 'view'))
      .map(p => ({ ...p, group: 'pages' as RecordGroup, groupLabel: GROUP_LABELS.pages }));
  }, [user]);

  // Load & role-scope records
  useEffect(() => {
    if (!open || !user) return;
    // Always rebuild when opening so role changes between sessions are respected.
    let cancelled = false;
    (async () => {
      setLoading(true);
      const allowedGroups = new Set(searchableGroups(user.role));
      try {
        const fetchIf = (g: RecordGroup, path: string) =>
          allowedGroups.has(g) ? api<any[]>(path).catch(() => []) : Promise.resolve([] as any[]);

        const [students, faculty, courses, books, fees, docs, exams, assignments, hostel, transport, notifs, workflows, admissions, payroll, timetable, messages] = await Promise.all([
          fetchIf('students', '/api/students'),
          fetchIf('faculty', '/api/faculty'),
          fetchIf('courses', '/api/courses'),
          fetchIf('books', '/api/library'),
          fetchIf('fees', '/api/fees'),
          fetchIf('documents', '/api/documents'),
          fetchIf('exams', '/api/exams'),
          fetchIf('assignments', '/api/assignments'),
          fetchIf('rooms', '/api/hostel'),
          fetchIf('routes', '/api/transport'),
          fetchIf('notifications', '/api/notifications'),
          fetchIf('workflows', '/api/workflows'),
          fetchIf('admissions', '/api/admissions'),
          fetchIf('payroll', '/api/payroll'),
          fetchIf('timetable', '/api/timetable'),
          fetchIf('messages', '/api/messages'),
        ]);
        if (cancelled) return;

        const items: SearchItem[] = [...pageItems];
        const push = (it: Omit<SearchItem, 'groupLabel'>) => items.push({ ...it, groupLabel: GROUP_LABELS[it.group] });

        students.forEach((s: any) => push({ id: 'stu:' + s.id, title: s.full_name, subtitle: `${s.student_id} · ${s.program} · Sem ${s.semester}`, group: 'students', icon: Users, color: 'from-cyan-500 to-teal-500', to: '/app/students', keywords: [s.email, s.student_id], resource: 'students' }));
        faculty.forEach((f: any) => push({ id: 'fac:' + f.id, title: f.full_name, subtitle: `${f.designation} · ${f.department}`, group: 'faculty', icon: UserCircle2, color: 'from-blue-500 to-indigo-600', to: '/app/faculty', keywords: [f.email], resource: 'faculty' }));
        courses.forEach((c: any) => push({ id: 'crs:' + c.id, title: c.title, subtitle: `${c.code} · ${c.faculty_name}`, group: 'courses', icon: BookOpen, color: 'from-violet-500 to-purple-600', to: '/app/courses', keywords: [c.code], resource: 'courses' }));
        books.forEach((b: any) => push({ id: 'bk:' + b.id, title: b.title, subtitle: `${b.author} · ${b.category}`, group: 'books', icon: Library, color: 'from-sky-500 to-blue-600', to: '/app/library', keywords: [b.isbn], resource: 'library' }));
        fees.forEach((f: any) => push({ id: 'fee:' + f.id, title: f.description, subtitle: `${f.invoice_no} · ₹${Number(f.amount).toLocaleString()} · ${f.status}`, group: 'fees', icon: CreditCard, color: 'from-emerald-500 to-teal-600', to: '/app/fees', keywords: [f.invoice_no], resource: 'fees', ownerStudentId: f.student_id }));
        docs.forEach((d: any) => push({ id: 'doc:' + d.id, title: d.title, subtitle: `${d.category} · ${d.file_type?.toUpperCase()}`, group: 'documents', icon: FolderOpen, color: 'from-blue-500 to-indigo-600', to: '/app/documents', resource: 'documents', ownerStudentId: d.owner }));
        exams.forEach((e: any) => push({ id: 'exm:' + e.id, title: e.subject, subtitle: `${e.exam_type} · ${e.exam_date} · ${e.room}`, group: 'exams', icon: GraduationCap, color: 'from-amber-500 to-orange-500', to: '/app/exams', keywords: [e.course_code], resource: 'exams' }));
        assignments.forEach((a: any) => push({ id: 'asg:' + a.id, title: a.title, subtitle: `${a.course_code} · due ${a.due_date}`, group: 'assignments', icon: FileText, color: 'from-rose-500 to-pink-600', to: '/app/assignments', resource: 'assignments', ownerStudentId: a.student_id }));
        hostel.forEach((h: any) => push({ id: 'hst:' + h.id, title: `Room ${h.block}-${h.room_no}`, subtitle: `${h.room_type} · ${h.status}${h.occupant_name ? ` · ${h.occupant_name}` : ''}`, group: 'rooms', icon: Building2, color: 'from-fuchsia-500 to-rose-500', to: '/app/hostel', resource: 'hostel' }));
        transport.forEach((t: any) => push({ id: 'trn:' + t.id, title: `Route ${t.route_no} — ${t.route_name}`, subtitle: `${t.driver_name} · ${t.vehicle_no}`, group: 'routes', icon: Bus, color: 'from-lime-500 to-emerald-500', to: '/app/transport', resource: 'transport' }));
        notifs.forEach((n: any) => push({ id: 'ntf:' + n.id, title: n.title, subtitle: n.body?.slice(0, 80), group: 'notifications', icon: Bell, color: 'from-rose-500 to-pink-600', to: '/app/notifications', resource: 'notifications' }));
        workflows.forEach((w: any) => push({ id: 'wf:' + w.id, title: w.title, subtitle: `${w.request_type} · ${w.status} · ${w.requester_name}`, group: 'workflows', icon: Workflow, color: 'from-orange-500 to-rose-500', to: '/app/workflows', keywords: [w.reference_no], resource: 'workflows' }));
        admissions.forEach((a: any) => push({ id: 'adm:' + a.id, title: a.full_name, subtitle: `${a.program} · ${a.status} · ${Number(a.score).toFixed(1)}%`, group: 'admissions', icon: GraduationCap, color: 'from-cyan-500 to-teal-500', to: '/app/admissions', keywords: [a.email], resource: 'admissions' }));
        payroll.forEach((p: any) => push({ id: 'pay:' + p.id, title: p.employee_name, subtitle: `${p.designation} · ${p.pay_period} · ₹${Number(p.net_pay).toLocaleString()}`, group: 'payroll', icon: DollarSign, color: 'from-amber-500 to-orange-500', to: '/app/payroll', keywords: [p.employee_id], resource: 'payroll' }));
        timetable.forEach((t: any) => push({ id: 'tt:' + t.id, title: t.subject, subtitle: `${t.course_code} · ${t.faculty} · ${t.room} · ${t.start_time}`, group: 'timetable', icon: Calendar, color: 'from-blue-500 to-indigo-600', to: '/app/timetable', keywords: [t.course_code, t.faculty], resource: 'timetable' }));
        messages.forEach((m: any) => push({ id: 'msg:' + m.id, title: m.subject || '(no subject)', subtitle: `${m.sender} → ${m.recipient}`, group: 'messages', icon: MessageSquare, color: 'from-violet-500 to-purple-600', to: '/app/messages', resource: 'messages', recipient: m.recipient, sender: m.sender }));

        // Enforce record-level isolation
        const filtered = items.filter(it => {
          if (it.group === 'pages') return true;
          return canSeeRecord({ role: user.role, studentId: user.studentId, email: user.email, record: { group: it.group, ownerStudentId: it.ownerStudentId, recipient: it.recipient, sender: it.sender } });
        });
        setIndex(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user, pageItems]);

  // Clear index when user changes so data never leaks across sessions
  useEffect(() => { setIndex([]); }, [user?.id]);

  useEffect(() => {
    if (open) { setActive(0); setQ(''); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // Results
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const visiblePages = pageItems.slice(0, 8);
    if (!query) {
      return { flat: visiblePages, grouped: [{ group: 'pages' as RecordGroup, label: 'Quick nav', items: visiblePages }] };
    }
    const scored: Array<{ item: SearchItem; score: number }> = [];
    for (const it of index) {
      const hay = [it.title, it.subtitle || '', (it.keywords || []).join(' ')].join(' ').toLowerCase();
      if (!hay.includes(query)) continue;
      let score = 0;
      if (it.title.toLowerCase().startsWith(query)) score += 10;
      if (it.title.toLowerCase().includes(query)) score += 6;
      if ((it.subtitle || '').toLowerCase().includes(query)) score += 3;
      if ((it.keywords || []).some(k => (k || '').toLowerCase().includes(query))) score += 4;
      if (it.group === 'pages') score += 2; // bias pages slightly
      scored.push({ item: it, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 80).map(x => x.item);
    const grouped = GROUP_ORDER
      .map(g => ({ group: g, label: GROUP_LABELS[g], items: top.filter(i => i.group === g) }))
      .filter(g => g.items.length);
    return { flat: top, grouped };
  }, [q, index, pageItems]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.flat.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
      else if (e.key === 'Enter') {
        const it = results.flat[active];
        if (it) { nav(it.to); onClose(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, active, results.flat, nav, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open || !user) return null;

  const roleTag = ({
    student: { label: 'Student', color: 'from-cyan-500 to-teal-500' },
    faculty: { label: 'Faculty', color: 'from-blue-500 to-indigo-600' },
    parent: { label: 'Parent', color: 'from-violet-500 to-purple-600' },
    admin: { label: 'Super Admin', color: 'from-rose-500 to-orange-500' },
  } as const)[user.role];

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[8vh] pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[680px] glass-strong rounded-2xl overflow-hidden fade-up" style={{ animationDuration: '0.35s' }} role="dialog" aria-modal="true" aria-label="Global search">
          {/* Input row */}
          <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
            <Search size={18} className="text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => { setQ(e.target.value); setActive(0); }}
              placeholder={`Search ${roleTag.label.toLowerCase()}-scoped records…`}
              className="flex-1 !bg-transparent !border-0 !p-0 !text-[15px] !shadow-none focus:!shadow-none"
              aria-label="Search query"
              data-no-theme-transition
            />
            <div className={`chip bg-gradient-to-r ${roleTag.color} text-white inline-flex shadow-sm`}>
              <ShieldCheck size={10} /> {roleTag.label}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--border-subtle)]" aria-label="Close search">
              <X size={15} />
            </button>
            {loading && <div className="absolute left-0 right-0 -bottom-px progress-indeterminate" />}
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[62vh] overflow-y-auto py-2">
            {results.grouped.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 flex items-center justify-center mb-4"><Search size={20} /></div>
                <div className="text-sm font-bold text-[var(--text-primary)]">No results for "{q}"</div>
                <div className="text-xs text-slate-500 mt-1">Results are scoped to what your role is permitted to see.</div>
                <div className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1"><Lock size={11} /> Data isolation active</div>
              </div>
            )}
            {results.grouped.map(g => (
              <div key={g.group} className="px-2 py-1.5">
                <div className="px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500">{g.label}</div>
                {g.items.map((it) => {
                  const absIdx = results.flat.indexOf(it);
                  const Icon = it.icon;
                  const isActive = absIdx === active;
                  return (
                    <button
                      key={it.id}
                      data-idx={absIdx}
                      onMouseEnter={() => setActive(absIdx)}
                      onClick={() => { nav(it.to); onClose(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/12 to-blue-600/12 ring-1 ring-cyan-500/30' : 'hover:bg-[var(--border-subtle)]'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${it.color} text-white flex items-center justify-center shadow-sm shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">{highlight(it.title, q)}</div>
                        {it.subtitle && <div className="text-[11.5px] text-[var(--text-tertiary)] truncate">{highlight(it.subtitle, q)}</div>}
                      </div>
                      <div className={`transition-all ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
                        <ArrowRight size={14} className="text-cyan-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-subtle)] px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><kbd className="mono px-1.5 py-0.5 rounded border border-[var(--border-subtle)]"><ArrowUp size={10} /></kbd><kbd className="mono px-1.5 py-0.5 rounded border border-[var(--border-subtle)]"><ArrowDown size={10} /></kbd> navigate</div>
              <div className="flex items-center gap-1.5"><kbd className="mono px-1.5 py-0.5 rounded border border-[var(--border-subtle)]"><CornerDownLeft size={10} /></kbd> open</div>
              <div className="flex items-center gap-1.5"><kbd className="mono px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">ESC</kbd> close</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock size={10} className="text-emerald-500" />
              {loading ? 'Indexing…' : `${index.length.toLocaleString()} records · role-scoped`}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
