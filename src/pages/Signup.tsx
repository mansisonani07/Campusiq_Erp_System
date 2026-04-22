import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PublicNav from '../components/PublicNav';
import { Mail, Lock, User, Building2, ArrowRight, Sparkles, GraduationCap, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useSession } from '../lib/session';
import { api } from '../lib/api';

function generateStudentId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `STU-${year}-${rand.toString().slice(-4).padStart(4, '0')}`;
}
function generateReferenceNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `WF-${year}-${rand}`;
}

export default function Signup() {
  const nav = useNavigate();
  const { login, logout } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [program, setProgram] = useState('B.Tech Computer Science');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  /**
   * Registration flow — creates an authoritative account row in the
   * `accounts` table, a matching student directory row, and a profile
   * creation approval request. The session established below is bound
   * strictly to the account we just created (using its DB id), so
   * there is no path for this new signup to be confused with any seeded
   * demo account (e.g. Alex Chen).
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const nm = name.trim();
    const em = email.trim().toLowerCase();
    const pw = password;
    if (!nm || !em || !pw || !institution.trim()) { setErr('All fields are required.'); return; }
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setBusy(true);
    // Make sure no prior session bleeds into the new account
    logout();
    try {
      const studentId = generateStudentId();
      // 1) Create the authoritative account row.
      const account = await api<any>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          email: em,
          password: pw,
          full_name: nm,
          role: 'student',
          student_id: studentId,
          program,
          semester: 1,
          institution: institution.trim(),
          status: 'active',
        }),
      });
      // 2) Create a directory row so the student appears in institutional records.
      await api('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          full_name: nm,
          email: em,
          phone: '',
          program,
          semester: 1,
          cgpa: 0,
          status: 'pending_approval',
          guardian: '',
          dob: '',
          address: '',
        }),
      }).catch(() => {});
      // 3) Submit a Profile Creation approval request for the admin dashboard.
      const wf = await api<any>('/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          reference_no: generateReferenceNo(),
          request_type: 'Profile Creation',
          title: `New student profile — ${nm}`,
          description: `Self-registered student. Email: ${em} · Program: ${program} · Institution: ${institution.trim()} · Student ID: ${studentId}`,
          requester_name: nm,
          status: 'pending',
          current_step: 1,
          total_steps: 2,
          created_at: new Date().toISOString(),
        }),
      }).catch(() => null);
      if (wf?.id) {
        await api('/api/approvals', {
          method: 'POST',
          body: JSON.stringify({
            workflow_id: wf.id,
            action: 'submitted',
            reason: null,
            actor: nm,
            actor_role: 'student',
            created_at: new Date().toISOString(),
          }),
        }).catch(() => {});
      }
      // 4) Also create a profile_requests record so the admin Account
      //    Approvals dashboard reflects this new registration.
      await api('/api/profile_requests', {
        method: 'POST',
        body: JSON.stringify({
          user_email: em,
          user_name: nm,
          role: 'student',
          changes: { registration: { from: '—', to: `${nm} · ${program} · ${studentId}` } },
          note: `New account registration from ${institution.trim()}.`,
        }),
      }).catch(() => {});
      // 5) Establish a session bound strictly to *this* account.
      login({
        id: `student-${account.id}`,
        name: account.full_name,
        email: account.email,
        role: 'student',
        studentId: account.student_id,
        program: account.program,
        semester: account.semester || 1,
      });
      nav('/app/dashboard');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 mesh-bg"/>
        <div className="absolute inset-0 bg-grid opacity-40"/>
        <div className="w-full max-w-md surface-solid rounded-3xl p-8 elev-3 fade-up relative">
          <div className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex mb-4"><Sparkles size={11}/> Get started</div>
          <h1 className="heading-display text-3xl text-slate-900 dark:text-white">Create your account.</h1>
          <p className="text-sm text-slate-500 mt-1.5">Join your institution on CampusIQ. Your profile is isolated to your own credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Full name</span>
              <div className="relative mt-1.5"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={name} onChange={e => setName(e.target.value)} className="!pl-9 w-full" placeholder="Your legal name" required/></div>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Institution</span>
              <div className="relative mt-1.5"><Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="e.g. Aravind College" className="!pl-9 w-full" required/></div>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Program</span>
              <div className="relative mt-1.5"><GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <select value={program} onChange={e => setProgram(e.target.value)} className="!pl-9 w-full">
                  <option>B.Tech Computer Science</option><option>B.Tech Electronics</option><option>B.Tech Mechanical</option>
                  <option>B.Sc Mathematics</option><option>B.Com</option><option>MBA</option><option>M.Tech AI & ML</option>
                </select></div>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</span>
              <div className="relative mt-1.5"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="!pl-9 w-full" placeholder="you@institute.edu" required/></div>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Password</span>
              <div className="relative mt-1.5"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="!pl-9 w-full" placeholder="Minimum 8 characters" minLength={8} required/></div>
            </label>
            {err && <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-start gap-2"><AlertTriangle size={13} className="shrink-0 mt-0.5"/><span>{err}</span></div>}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20 text-[11.5px] text-cyan-700 dark:text-cyan-300">
              <ShieldCheck size={14} className="shrink-0 mt-0.5"/>
              <div>Your session is bound to the credentials you just registered. A <b>Profile Creation</b> request is also sent to super admin for review.</div>
            </div>
            <button disabled={busy} type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {busy ? 'Creating your profile…' : 'Create account'} {!busy && <ArrowRight size={15}/>}
            </button>
          </form>
          <div className="text-xs text-center text-slate-500 mt-6">Already have an account? <Link to="/login" className="text-cyan-600 font-bold hover:underline">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}
