import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import { useSession, type Role } from '../lib/session';
import { api } from '../lib/api';
import { ArrowRight, Shield, Mail, Lock, KeyRound, GraduationCap, BookOpen, Users, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

const DEMOS: { role: Role; email: string; name: string; icon: any; color: string; subtitle: string }[] = [
  { role: 'student', email: 'alex.chen@campusiq.edu', name: 'Alex Chen', icon: GraduationCap, color: 'from-cyan-500 to-teal-500', subtitle: 'B.Tech CSE · Sem 5' },
  { role: 'faculty', email: 'dr.meera@campusiq.edu', name: 'Dr. Meera Shankar', icon: BookOpen, color: 'from-blue-500 to-indigo-600', subtitle: 'Associate Professor · CSE' },
  { role: 'parent', email: 'ravi.chen@gmail.com', name: 'Ravi Chen', icon: Users, color: 'from-violet-500 to-purple-600', subtitle: 'Parent of Alex Chen' },
  { role: 'admin', email: 'admin@campusiq.edu', name: 'Priya Iyer', icon: Shield, color: 'from-rose-500 to-orange-500', subtitle: 'Super Administrator' },
];

export default function Login() {
  const nav = useNavigate();
  const { login } = useSession();
  const [step, setStep] = useState<'cred' | 'otp'>('cred');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sentCode, setSentCode] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  // Account resolved from the accounts API — source of truth for the session
  const [pendingAccount, setPendingAccount] = useState<any | null>(null);

  const pickDemo = (d: typeof DEMOS[number]) => {
    setEmail(d.email);
    setPassword('campus123');
    setErr(''); setInfo('');
  };

  /**
   * Step 1: verify credentials against the accounts table.
   * On success, stash the fully-resolved account and move to OTP.
   * This replaces the old buggy "DEMOS.find" fallback that auto-mapped
   * unknown emails to the default Alex Chen profile.
   */
  const submitCred = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setInfo('');
    if (!email.trim() || !password) { setErr('Email and password are required.'); return; }
    setBusy(true);
    try {
      const account = await api<any>('/api/accounts?action=login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      setPendingAccount(account);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);
      setStep('otp');
    } catch (e: any) {
      setErr(e?.message || 'Could not sign you in.');
      setPendingAccount(null);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Step 2: verify the OTP then establish a session *for the resolved
   * account only*. No fallback to demo accounts under any circumstance.
   */
  const verifyOtp = () => {
    const entered = otp.join('');
    if (entered.length !== 6) { setErr('Enter all 6 digits.'); return; }
    if (!pendingAccount) { setErr('Session expired. Please sign in again.'); setStep('cred'); return; }
    const acc = pendingAccount;
    login({
      id: `${acc.role}-${acc.id}`,
      name: acc.full_name,
      email: acc.email,
      role: acc.role as Role,
      department: acc.department || undefined,
      studentId: acc.student_id || undefined,
      program: acc.program || undefined,
      semester: acc.semester || undefined,
    });
    nav('/app/dashboard');
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp]; next[i] = clean; setOtp(next);
    if (clean && i < 5) { (document.getElementById('otp-' + (i + 1)) as HTMLInputElement)?.focus(); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <div className="flex-1 grid lg:grid-cols-[1.1fr_1fr]">
        {/* Left — marketing */}
        <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-12">
          <div className="absolute inset-0 mesh-bg" />
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-600/30 blur-3xl float-slow" />
          <div className="relative max-w-md scale-in">
            <div className="chip bg-white/80 dark:bg-slate-900/70 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 backdrop-blur-sm inline-flex mb-5 elev-1"><Sparkles size={11} /> Secure Access</div>
            <h2 className="heading-display text-4xl text-slate-900 dark:text-white">One portal. <span className="text-gradient-brand">Every role.</span></h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">Sign in with session-based authentication and one-time verification to your students, faculty, parents or admin workspace. Your session is strictly bound to the account you authenticate with.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 stagger">
              {DEMOS.map(d => (
                <button key={d.role} onClick={() => pickDemo(d)} className="surface rounded-2xl p-4 text-left hover-lift card-gradient-border">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.color} text-white flex items-center justify-center mb-3 shadow-lg`}><d.icon size={18} /></div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{d.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.subtitle}</div>
                  <div className="text-[10.5px] text-cyan-600 dark:text-cyan-400 mono mt-2 truncate">{d.email}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 text-[11.5px] text-slate-500 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Click any demo to autofill · password <span className="mono font-bold text-cyan-600">campus123</span>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md surface-solid rounded-3xl p-8 elev-3 fade-up">
            {step === 'cred' ? (
              <>
                <h1 className="heading-display text-3xl text-slate-900 dark:text-white">Welcome back.</h1>
                <p className="text-sm text-slate-500 mt-1.5">Sign in to your CampusIQ workspace.</p>
                <form onSubmit={submitCred} className="mt-7 space-y-3.5">
                  <label className="block">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</span>
                    <div className="relative mt-1.5">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@institute.edu" className="!pl-9 w-full" />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Password</span>
                    <div className="relative mt-1.5">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="!pl-9 w-full" />
                    </div>
                  </label>
                  {err && <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-start gap-2"><AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{err}</span></div>}
                  {info && <div className="text-xs text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-2.5 rounded-lg border border-cyan-200 dark:border-cyan-500/20">{info}</div>}
                  <div className="flex items-center justify-between text-[11.5px]">
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer"><input type="checkbox" className="!w-3.5 !h-3.5" /> Remember me</label>
                    <Link to="/forgot" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">Forgot password?</Link>
                  </div>
                  <button type="submit" disabled={busy} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                    {busy ? 'Verifying…' : 'Continue'} {!busy && <ArrowRight size={15} />}
                  </button>
                </form>
                <div className="text-xs text-center text-slate-500 mt-6">New to CampusIQ? <Link to="/signup" className="text-cyan-600 font-bold hover:underline">Create an account</Link></div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center mb-5 shadow-lg"><KeyRound size={22} /></div>
                <h1 className="heading-display text-3xl text-slate-900 dark:text-white">Verify it's you.</h1>
                <p className="text-sm text-slate-500 mt-1.5">We sent a 6-digit code to <span className="font-bold text-slate-700 dark:text-slate-300">{pendingAccount?.email || email}</span>.</p>
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[12.5px] flex items-center gap-2">
                  <Sparkles size={14} />
                  Demo code: <span className="mono font-bold">{sentCode}</span>
                </div>
                <div className="mt-6 flex gap-2 justify-between">
                  {otp.map((d, i) => (
                    <input key={i} id={`otp-${i}`} value={d} onChange={e => setDigit(i, e.target.value)} maxLength={1} className="w-[48px] h-14 text-center text-xl font-black" />
                  ))}
                </div>
                {err && <div className="text-xs text-rose-600 mt-3">{err}</div>}
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setOtp(sentCode.split(''))} className="btn-ghost flex-1">Fill demo</button>
                  <button onClick={verifyOtp} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">Verify <CheckCircle2 size={14} /></button>
                </div>
                <button onClick={() => { setStep('cred'); setOtp(['', '', '', '', '', '']); setPendingAccount(null); }} className="text-xs text-slate-500 mt-5 hover:text-cyan-600 font-semibold">← Back</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
