import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIERS = [
  { n: 'Starter', p: '$0', per: 'per month', desc: 'Single department pilot', feats: ['Up to 500 students', 'Core modules', 'Email support', '99% SLA'] },
  { n: 'Institute', p: '$0', per: 'per month', desc: 'Full college edition', feats: ['Up to 10,000 students', 'All modules', '24×7 support', '99.9% SLA', 'Dedicated CSM'], featured: true },
  { n: 'Enterprise', p: 'Custom', per: 'annual contract', desc: 'Universities & multi-campus', feats: ['Unlimited students', 'White-labeling', 'On-prem optional', '99.99% SLA', 'SAML + SSO', 'Custom integrations'] },
];

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 lg:px-8 py-20">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex"><Sparkles size={11} /> Pricing</div>
            <h1 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">Simple, <span className="text-gradient-brand">transparent pricing.</span></h1>
            <p className="text-slate-500 mt-4 text-[15.5px]">No hidden seat fees. Cancel any time.</p>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 lg:px-8 pb-20 -mt-8">
        <div className="grid md:grid-cols-3 gap-5 stagger">
          {TIERS.map(t => (
            <div key={t.n} className={`rounded-3xl p-8 relative ${t.featured ? 'bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-700 text-white shadow-2xl shadow-cyan-500/30 scale-[1.03] elev-3' : 'surface-solid hover-lift'}`}>
              {t.featured && (
                <>
                  <div className="absolute inset-0 bg-grid opacity-15 rounded-3xl pointer-events-none" />
                  <div className="chip bg-white/20 text-white border border-white/30 inline-flex mb-3 relative"><Sparkles size={10} /> Most popular</div>
                </>
              )}
              <div className="relative">
                <div className={`text-[13px] font-bold uppercase tracking-wider ${t.featured ? 'text-white/80' : 'text-slate-500'}`}>{t.n}</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <div className="heading-display text-5xl">{t.p}</div>
                  <div className={`text-[12px] font-semibold ${t.featured ? 'text-white/80' : 'text-slate-500'}`}>/ {t.per}</div>
                </div>
                <div className={`text-[13.5px] mt-1 ${t.featured ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>{t.desc}</div>
                <div className={`h-px my-6 ${t.featured ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`} />
                <ul className="space-y-2.5 text-[13.5px]">
                  {t.feats.map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 size={14} className={t.featured ? 'text-emerald-200' : 'text-cyan-500'} />{f}</li>
                  ))}
                </ul>
                <Link to="/contact" className={`block text-center w-full mt-7 py-3 rounded-xl font-bold transition-transform hover:scale-[1.02] ${t.featured ? 'bg-white text-cyan-700' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}>
                  Get started <ArrowRight size={13} className="inline ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10 text-xs text-slate-500">All plans include unlimited admin seats · 14-day free trial · no credit card required</div>
      </section>
      <PublicFooter />
    </div>
  );
}
