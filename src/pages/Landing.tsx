import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { ArrowRight, Sparkles, Shield, Activity, BookOpen, Users, CreditCard, GraduationCap, Building2, Bus, Bell, BarChart3, Briefcase, ClipboardList, FileText, Library, Workflow, Calendar, CheckCircle2, Quote, Zap, Lock, Globe, Play, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Donut, Sparkline } from '../components/Charts';

const MODULES = [
  { icon: GraduationCap, label: 'Admissions', desc: 'Online applications, shortlist, interview & offer pipeline.', color: 'from-cyan-500 to-teal-500' },
  { icon: ClipboardList, label: 'Attendance', desc: 'Biometric, QR & manual entry — with live shortage reports.', color: 'from-blue-500 to-indigo-600' },
  { icon: Calendar, label: 'Timetables', desc: 'Auto-generate conflict-free weekly schedules by department.', color: 'from-violet-500 to-purple-600' },
  { icon: CreditCard, label: 'Fees', desc: 'UPI, card, netbanking with auto receipts and reminders.', color: 'from-amber-500 to-orange-500' },
  { icon: BookOpen, label: 'LMS', desc: 'Video lectures, interactive quizzes and course certificates.', color: 'from-rose-500 to-pink-600' },
  { icon: FileText, label: 'Assignments', desc: 'Upload, grade, rubrics, plagiarism-ready integrations.', color: 'from-emerald-500 to-teal-600' },
  { icon: Library, label: 'Library', desc: 'Catalog, reservations, auto-fines, e-resources and holds.', color: 'from-sky-500 to-blue-600' },
  { icon: Building2, label: 'Hostel', desc: 'Rooms, mess, warden contacts and leave / complaint flows.', color: 'from-fuchsia-500 to-rose-500' },
  { icon: Bus, label: 'Transport', desc: 'Live GPS, route planning, boarding logs & parent alerts.', color: 'from-lime-500 to-emerald-500' },
  { icon: Briefcase, label: 'HR & Payroll', desc: 'Employees, leave, salary processing, TDS and Form-16.', color: 'from-cyan-500 to-teal-600' },
  { icon: Bell, label: 'Notifications', desc: 'Email, SMS, push & in-app — with delivery analytics.', color: 'from-indigo-500 to-blue-600' },
  { icon: BarChart3, label: 'Analytics', desc: 'Institution dashboards, retention models, custom KPIs.', color: 'from-teal-500 to-blue-600' },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        {/* floating orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-600/30 blur-3xl float-slow pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-teal-400/25 to-cyan-600/25 blur-3xl float-slow pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-36">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 chip bg-white/80 dark:bg-slate-900/70 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 backdrop-blur-sm elev-1 mb-6">
                <Sparkles size={11} /> New · v4.0 · Academic OS
              </div>
              <h1 className="heading-display text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem] text-slate-900 dark:text-white">
                One platform for the<br />
                <span className="text-gradient-brand">entire campus lifecycle.</span>
              </h1>
              <p className="text-[17px] text-slate-600 dark:text-slate-400 mt-6 max-w-xl leading-relaxed">
                CampusIQ unifies admissions, attendance, timetables, fees, LMS, exams, library, hostel, transport, payroll and analytics — with role-based portals for students, faculty, parents and admins.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/login" className="btn-primary inline-flex items-center gap-2">Open portal <ArrowRight size={15} /></Link>
                <Link to="/admissions" className="btn-ghost inline-flex items-center gap-2"><Play size={13} /> Apply for admission</Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-9 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2"><Shield size={15} className="text-emerald-500" /> FERPA-ready</div>
                <div className="flex items-center gap-2"><Globe size={15} className="text-cyan-500" /> 28 countries</div>
                <div className="flex items-center gap-2"><Lock size={15} className="text-blue-500" /> SOC 2 Type II</div>
                <div className="flex items-center gap-2"><Zap size={15} className="text-amber-500" /> 99.99% uptime</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12 }} className="relative">
              <div className="absolute -inset-10 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-500/10 rounded-[40px] blur-3xl" />
              {/* mock dashboard */}
              <div className="relative glass-card rounded-3xl p-5 elev-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="text-[10.5px] mono text-slate-500">campusiq.edu / dashboard</div>
                </div>
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {[
                    { l: 'Students', v: '12,486', c: 'from-cyan-500 to-teal-500', s: [8, 12, 10, 14, 18, 22, 26] },
                    { l: 'Faculty', v: '842', c: 'from-blue-500 to-indigo-600', s: [4, 5, 6, 7, 7, 8, 9] },
                    { l: 'Attendance', v: '93.2%', c: 'from-violet-500 to-purple-600', s: [82, 85, 88, 90, 91, 92, 93] },
                  ].map(s => (
                    <div key={s.l} className="rounded-2xl p-3 bg-white/60 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700/40">
                      <div className="text-[9.5px] uppercase tracking-widest text-slate-500 font-bold">{s.l}</div>
                      <div className={`text-[22px] font-black mt-0.5 bg-gradient-to-br ${s.c} bg-clip-text text-transparent`}>{s.v}</div>
                      <div className="text-cyan-600 mt-1"><Sparkline data={s.s} /></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-4 bg-white/60 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700/40 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Attendance · last 7 days</div>
                    <div className="chip bg-emerald-500/10 text-emerald-600 text-[9.5px]">↑ 2.4%</div>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    <LineChart data={[82, 88, 85, 91, 89, 93, 96]} labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']} height={130} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl p-3.5 bg-white/60 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700/40 flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] uppercase tracking-widest text-slate-500 font-bold">Fee collection</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">₹1.84 Cr</div>
                      <div className="text-[10px] text-slate-500">August cycle</div>
                    </div>
                    <Donut value={72} total={100} size={64} stroke={8} />
                  </div>
                  <div className="rounded-2xl p-3 bg-white/60 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700/40 space-y-1.5">
                    <div className="text-[9.5px] uppercase tracking-widest text-slate-500 font-bold mb-1">Up next</div>
                    {[{ n: 'DSA · CS-301', t: '10:00' }, { n: 'Operating Systems', t: '11:30' }, { n: 'Workshop · Lab', t: '14:00' }].map(c => (
                      <div key={c.n} className="flex items-center justify-between text-[11px]">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{c.n}</div>
                        <div className="text-slate-500 mono">{c.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* floating badges */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                className="absolute -left-6 top-12 glass-card rounded-2xl p-3 px-4 flex items-center gap-2.5 hidden md:flex">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center"><CheckCircle2 size={16} /></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Just now</div><div className="text-xs font-bold">94 students marked present</div></div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
                className="absolute -right-6 bottom-16 glass-card rounded-2xl p-3 px-4 flex items-center gap-2.5 hidden md:flex">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center"><Star size={16} /></div>
                <div><div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Avg rating</div><div className="text-xs font-bold">4.8 / 5 · faculty</div></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-[#0a0f1e]/70 backdrop-blur-md overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-9">
          <div className="text-[10.5px] uppercase tracking-[0.28em] text-slate-500 font-bold text-center mb-6">Trusted by 320+ institutions across 28 countries</div>
          <div className="flex overflow-hidden">
            <div className="marquee-row flex gap-14 shrink-0 pr-14 items-center">
              {['Northfield Institute', 'Aravind College', 'BlueSky University', 'Ridgeview Polytechnic', 'Harborline Academy', 'St. Claremont', 'Sunridge University', 'Orbit Tech Institute', 'Kingsway College', 'Helix International'].map(n => (
                <div key={n} className="text-base font-bold text-slate-400 dark:text-slate-600 whitespace-nowrap tracking-tight">{n}</div>
              ))}
            </div>
            <div className="marquee-row flex gap-14 shrink-0 pr-14 items-center" aria-hidden>
              {['Northfield Institute', 'Aravind College', 'BlueSky University', 'Ridgeview Polytechnic', 'Harborline Academy', 'St. Claremont', 'Sunridge University', 'Orbit Tech Institute', 'Kingsway College', 'Helix International'].map(n => (
                <div key={n + 'b'} className="text-base font-bold text-slate-400 dark:text-slate-600 whitespace-nowrap tracking-tight">{n}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-24">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 inline-flex">12 Integrated Modules</div>
          <h2 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">
            Everything the campus needs, <span className="text-gradient-brand">already built.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-[15.5px] leading-relaxed">Twelve integrated modules with role-based views and enterprise-grade workflows. No more juggling five separate tools.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {MODULES.map((m) => (
            <div key={m.label} className="group relative surface rounded-2xl p-6 hover-lift card-gradient-border">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                <m.icon size={22} />
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-[15.5px] tracking-tight">{m.label}</div>
              <div className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{m.desc}</div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight size={11} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="relative bg-white dark:bg-[#0a0f1e] border-y border-slate-200 dark:border-slate-800/60 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex">Role-based portals</div>
            <h2 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">Four portals. <span className="text-gradient-brand">One source of truth.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            {[
              { icon: GraduationCap, title: 'Student', desc: 'Timetable, attendance, assignments, fees, library, hostel, transport, results.', features: ['Live class schedule', 'Assignment submissions', 'Online fee payments', 'Exam results & ranks'], color: 'from-cyan-500 to-teal-500' },
              { icon: BookOpen, title: 'Faculty', desc: 'Mark attendance, post materials, grade, manage courses and approvals.', features: ['Gradebook', 'Attendance entry', 'LMS content', 'Workflow approvals'], color: 'from-blue-500 to-indigo-600' },
              { icon: Users, title: 'Parent', desc: "Ward's progress, attendance, fee alerts, transport and messages.", features: ['Attendance alerts', 'Fee reminders', 'Result access', 'Direct messaging'], color: 'from-violet-500 to-purple-600' },
              { icon: Shield, title: 'Super Admin', desc: 'Full control: admissions, HR, payroll, analytics and system settings.', features: ['Institution-wide analytics', 'HR & payroll', 'Workflow designer', 'Audit logs'], color: 'from-rose-500 to-orange-500' },
            ].map(r => (
              <div key={r.title} className="surface-solid rounded-2xl p-6 hover-lift">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center mb-4 shadow-lg`}><r.icon size={22} /></div>
                <div className="font-bold text-slate-900 dark:text-white text-[15.5px] tracking-tight">{r.title} portal</div>
                <div className="text-[13.5px] text-slate-500 mt-1.5 leading-relaxed">{r.desc}</div>
                <div className="divider-soft my-4" />
                <ul className="space-y-2">
                  {r.features.map(f => <li key={f} className="text-[13px] flex items-center gap-2 text-slate-600 dark:text-slate-400"><CheckCircle2 size={13} className="text-cyan-500 shrink-0" />{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { v: '320+', l: 'Institutions', s: 'Colleges and institutes' },
            { v: '4.8M', l: 'Students', s: 'Active platform users' },
            { v: '99.99%', l: 'Uptime', s: 'Multi-region redundancy' },
            { v: '1.8s', l: 'Avg load', s: 'P50 dashboard render' },
          ].map(s => (
            <div key={s.l} className="surface rounded-2xl p-7 text-center hover-lift card-gradient-border">
              <div className="heading-display text-5xl text-gradient-brand">{s.v}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-2">{s.l}</div>
              <div className="text-xs text-slate-500 mt-1">{s.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gradient-to-b from-slate-50 to-white dark:from-[#050811] dark:to-[#0a0f1e] border-t border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="chip bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 inline-flex">Testimonials</div>
            <h2 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">Leaders on the ground.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 stagger">
            {[
              { q: "We consolidated five systems into CampusIQ. Admissions season is now a breeze.", a: 'Dr. Meera Shankar', r: 'Registrar, Aravind College', rating: 5 },
              { q: "Parents love the live attendance and fee alerts. Our helpdesk calls are down 60%.", a: 'Rajiv Menon', r: 'Principal, Sunridge University', rating: 5 },
              { q: "The analytics unlocked patterns we couldn't see before — retention is up 8 points.", a: 'Prof. Aisha Patel', r: 'Dean, Ridgeview Polytechnic', rating: 5 },
            ].map(t => (
              <div key={t.a} className="surface-solid rounded-2xl p-7 hover-lift relative">
                <Quote className="absolute top-5 right-5 text-cyan-500/20" size={36} />
                <div className="flex gap-0.5 mb-3">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[14.5px]">"{t.q}"</p>
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm">{t.a.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                  <div><div className="text-sm font-bold text-slate-900 dark:text-white">{t.a}</div><div className="text-[11.5px] text-slate-500">{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-700 p-10 lg:p-16 text-white elev-3">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="chip bg-white/20 border border-white/30 text-white inline-flex mb-5"><Sparkles size={11} /> Ready in two weeks</div>
            <h2 className="heading-display text-4xl lg:text-5xl">Run your campus on CampusIQ.</h2>
            <p className="mt-4 text-white/90 text-[15.5px] max-w-xl leading-relaxed">Spin up a pilot instance, import your data, and onboard your first cohort in under two weeks.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link to="/admissions" className="bg-white text-cyan-700 rounded-xl px-6 py-3.5 font-bold inline-flex items-center gap-2 hover:scale-[1.02] transition-transform">Apply for admission <ArrowRight size={15} /></Link>
              <Link to="/contact" className="border border-white/50 rounded-xl px-6 py-3.5 font-bold hover:bg-white/10 transition-colors">Talk to sales</Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
