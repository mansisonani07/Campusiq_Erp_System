import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { ClipboardList, Calendar, CreditCard, BookOpen, Library, Building2, Bus, Briefcase, BarChart3, Bell, Workflow, Shield, FileText, GraduationCap, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { icon: GraduationCap, title: 'Admissions', color: 'from-cyan-500 to-teal-500', bullets: ['Online application portal', 'Bulk document uploads', 'Custom scoring rubrics', 'Shortlist, interview, offer workflow'] },
  { icon: ClipboardList, title: 'Attendance', color: 'from-blue-500 to-indigo-600', bullets: ['Biometric / RFID / QR / manual', 'Session-wise and daily views', 'Auto-generated shortage reports', 'Leave requests & approvals'] },
  { icon: Calendar, title: 'Timetables', color: 'from-violet-500 to-purple-600', bullets: ['Auto-scheduler with conflict detection', 'Per-faculty / per-room views', 'Bulk import from XLSX', 'Real-time room changes'] },
  { icon: CreditCard, title: 'Fees', color: 'from-emerald-500 to-teal-600', bullets: ['Online payments (UPI, cards, netbanking)', 'Auto receipts & reminders', 'Scholarship & concession tracking', 'Multi-installment plans'] },
  { icon: FileText, title: 'Exams & Results', color: 'from-amber-500 to-orange-500', bullets: ['Exam calendar & hall tickets', 'Question bank & OMR scanner', 'Moderation & publish workflow', 'Grade-book export'] },
  { icon: BookOpen, title: 'LMS & Assignments', color: 'from-rose-500 to-pink-600', bullets: ['Rich content (video, slides, PDF)', 'Auto-graded quizzes & rubrics', 'Plagiarism integration', 'Discussion forums'] },
  { icon: Library, title: 'Library', color: 'from-sky-500 to-blue-600', bullets: ['Catalog & barcode check-in/out', 'Reservations & holds', 'Auto-fine rules', 'Journal & e-resources'] },
  { icon: Building2, title: 'Hostel', color: 'from-fuchsia-500 to-rose-500', bullets: ['Block & room allocation', 'Warden & mess management', 'Visitor logs', 'Leave / complaint workflow'] },
  { icon: Bus, title: 'Transport', color: 'from-lime-500 to-emerald-500', bullets: ['Route & stop planning', 'Live GPS tracking', 'Parent pickup alerts', 'Fee-linked allocation'] },
  { icon: Briefcase, title: 'HR & Payroll', color: 'from-cyan-500 to-teal-600', bullets: ['Employee master & contracts', 'Leave & attendance', 'Salary processing & TDS', 'Payslips & Form-16'] },
  { icon: Bell, title: 'Notifications', color: 'from-indigo-500 to-blue-600', bullets: ['Email / SMS / Push / In-app', 'Bulk broadcast', 'Template editor', 'Delivery analytics'] },
  { icon: BarChart3, title: 'Analytics', color: 'from-teal-500 to-blue-600', bullets: ['Institution dashboards', 'Retention & risk models', 'Custom KPIs', 'CSV / PDF exports'] },
  { icon: Workflow, title: 'Workflow Approvals', color: 'from-orange-500 to-rose-500', bullets: ['Configurable multi-step approvals', 'Role & OU based routing', 'Audit trail', 'SLA timers'] },
  { icon: Shield, title: 'Security', color: 'from-slate-500 to-slate-700', bullets: ['Session-based auth + OTP', 'Role-based access', 'Audit logs', 'Backups & restore'] },
];

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 inline-flex">Features</div>
            <h1 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">Every module your campus needs.</h1>
            <p className="text-slate-500 mt-4 text-[15.5px] leading-relaxed">From admissions to alumni relations — CampusIQ ships with the entire stack, integrated and battle-tested.</p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-20 -mt-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {FEATURES.map(f => (
            <div key={f.title} className="surface-solid rounded-2xl p-6 hover-lift card-gradient-border">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-4 shadow-lg`}><f.icon size={22} /></div>
              <div className="font-bold text-slate-900 dark:text-white tracking-tight">{f.title}</div>
              <ul className="mt-3 space-y-1.5">
                {f.bullets.map(b => <li key={b} className="text-[12.5px] flex items-start gap-1.5 text-slate-600 dark:text-slate-400"><CheckCircle2 size={12} className="text-cyan-500 shrink-0 mt-[3px]" />{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
