import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { Users, Zap, Shield, Globe, Heart, Target, Rocket, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 lg:px-8 py-20">
          <div className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex"><Sparkles size={11} /> About us</div>
          <h1 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">We build the <span className="text-gradient-brand">academic OS</span> of the modern era.</h1>
          <p className="text-slate-500 mt-5 max-w-2xl text-[15.5px] leading-relaxed">CampusIQ was founded in 2019 by educators and engineers who were tired of duct-taping spreadsheets and legacy ERPs. Today, 320+ institutions across 28 countries run their daily operations on us.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 lg:px-8 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { i: Users, t: '280+', s: 'Team members worldwide', c: 'from-cyan-500 to-teal-500' },
            { i: Globe, t: '28', s: 'Countries served', c: 'from-blue-500 to-indigo-600' },
            { i: Shield, t: 'SOC 2', s: 'Type II certified', c: 'from-emerald-500 to-teal-600' },
            { i: Zap, t: '99.99%', s: 'Uptime SLA', c: 'from-amber-500 to-orange-500' },
          ].map(x => (
            <div key={x.s} className="surface-solid rounded-2xl p-6 hover-lift">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${x.c} text-white flex items-center justify-center mb-4 shadow-lg`}><x.i size={20} /></div>
              <div className="heading-display text-3xl text-slate-900 dark:text-white">{x.t}</div>
              <div className="text-[13px] text-slate-500 mt-1">{x.s}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div className="surface-solid rounded-2xl p-7">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center mb-4"><Heart size={20} /></div>
            <h2 className="heading-display text-2xl text-slate-900 dark:text-white">Our mission</h2>
            <p className="text-slate-500 mt-3 leading-relaxed text-[14.5px]">Make world-class academic software accessible to every institution — from boutique colleges to 100,000-student universities — without the cost and complexity of legacy enterprise systems.</p>
          </div>
          <div className="surface-solid rounded-2xl p-7">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center mb-4"><Target size={20} /></div>
            <h2 className="heading-display text-2xl text-slate-900 dark:text-white">Our values</h2>
            <ul className="text-slate-600 dark:text-slate-400 mt-3 space-y-2 text-[13.5px] leading-relaxed">
              <li>• <b>Educators first</b> — every feature ships through faculty feedback.</li>
              <li>• <b>Security as a product</b> — FERPA, GDPR, SOC 2 built-in.</li>
              <li>• <b>Radical simplicity</b> — most workflows fit on one screen.</li>
              <li>• <b>Transparent pricing</b> — no hidden seats, no forced upgrades.</li>
            </ul>
          </div>
        </div>
        <div className="surface-solid rounded-2xl p-8 mt-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center mb-4"><Rocket size={20} /></div>
            <h2 className="heading-display text-2xl text-slate-900 dark:text-white">The road ahead</h2>
            <p className="text-slate-500 mt-3 leading-relaxed text-[14.5px] max-w-2xl">By 2027, we're building the next-generation academic intelligence layer: predictive retention, AI tutors, automated accreditation reporting, and global credential portability — all natively integrated into the CampusIQ stack.</p>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
