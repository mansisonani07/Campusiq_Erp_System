import { useState } from 'react';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { api } from '../lib/api';
import { CheckCircle2, GraduationCap, Send, Sparkles } from 'lucide-react';

export default function Admissions() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', program: 'B.Tech Computer Science', guardian: '', score: '', essay: '' });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/admissions', { method: 'POST', body: JSON.stringify({ ...form, score: parseFloat(form.score) || 0, status: 'pending' }) });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 lg:px-8 py-16">
          <div className="text-center mb-10 fade-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30"><GraduationCap size={28} /></div>
            <div className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex mt-5"><Sparkles size={10} /> Admissions 2026 · Now open</div>
            <h1 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">Start your journey.</h1>
            <p className="text-slate-500 mt-3 text-[15.5px]">Apply online. Track status directly from your CampusIQ account.</p>
          </div>
          {done ? (
            <div className="surface-solid rounded-3xl p-10 text-center max-w-lg mx-auto elev-2 fade-up">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-xl"><CheckCircle2 size={30} /></div>
              <h2 className="heading-display text-3xl mt-5 text-slate-900 dark:text-white">Application submitted!</h2>
              <p className="text-slate-500 mt-3 text-[14.5px] leading-relaxed">Your application ID has been emailed to <b className="text-slate-900 dark:text-white">{form.email}</b>. The admissions team will review within 5–7 working days.</p>
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-left text-[13px] text-slate-700 dark:text-slate-300">
                <div className="font-bold text-cyan-700 dark:text-cyan-300 mb-2 text-[11px] uppercase tracking-wider">What happens next?</div>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Document verification (1–2 days)</li>
                  <li>Entrance score review & shortlisting</li>
                  <li>Interview invitation if shortlisted</li>
                  <li>Offer letter & enrollment</li>
                </ol>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="surface-solid rounded-3xl p-7 lg:p-10 grid sm:grid-cols-2 gap-4 elev-2 fade-up">
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Full name</span>
                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</span>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Phone</span>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Guardian name</span>
                <input required value={form.guardian} onChange={e => setForm({ ...form, guardian: e.target.value })} className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Program of interest</span>
                <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} className="w-full mt-1.5">
                  <option>B.Tech Computer Science</option><option>B.Tech Electronics</option><option>B.Tech Mechanical</option>
                  <option>B.Sc Mathematics</option><option>B.Com</option><option>MBA</option><option>M.Tech AI & ML</option>
                </select></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Entrance score (%)</span>
                <input required value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} type="number" min="0" max="100" step="0.1" className="w-full mt-1.5" /></label>
              <label className="block sm:col-span-2"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Statement of purpose (short)</span>
                <textarea rows={4} value={form.essay} onChange={e => setForm({ ...form, essay: e.target.value })} className="w-full mt-1.5" placeholder="Tell us about yourself and your goals…" /></label>
              <div className="sm:col-span-2 flex items-center justify-between flex-wrap gap-3 pt-2">
                <div className="text-[11.5px] text-slate-500">By submitting, you agree to the privacy policy & terms.</div>
                <button disabled={busy} className="btn-primary inline-flex items-center gap-2 disabled:opacity-70">{busy ? 'Submitting…' : 'Submit application'} <Send size={15} /></button>
              </div>
            </form>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
