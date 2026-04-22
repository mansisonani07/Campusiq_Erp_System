import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { Mail, Phone, MapPin, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc] dark:bg-[#050811]">
      <PublicNav />
      <section className="relative overflow-hidden flex-1">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-5xl mx-auto px-4 lg:px-8 py-20 grid md:grid-cols-2 gap-10">
          <div className="fade-up">
            <div className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 inline-flex"><Sparkles size={11} /> Contact</div>
            <h1 className="heading-display text-4xl sm:text-5xl text-slate-900 dark:text-white mt-5">Let's build your <span className="text-gradient-brand">campus stack.</span></h1>
            <p className="text-slate-500 mt-4 text-[15.5px] leading-relaxed">Schedule a live demo with our education specialists. We'll tailor a rollout plan for your institution — typically 2–3 weeks from kickoff to go-live.</p>
            <div className="mt-8 space-y-3.5">
              {[
                { i: Mail, l: 'sales@campusiq.edu', s: 'Email us' },
                { i: Phone, l: '+1 (415) 555-0178', s: 'Mon–Fri, 9am–7pm PT' },
                { i: MapPin, l: 'Bangalore · Singapore · New York', s: 'Offices worldwide' },
              ].map(x => (
                <div key={x.l} className="flex items-center gap-3 p-3.5 rounded-2xl surface-solid hover-lift">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md"><x.i size={17} /></div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{x.l}</div>
                    <div className="text-[11.5px] text-slate-500">{x.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="surface-solid rounded-3xl p-7 space-y-3.5 elev-2 fade-up">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center"><CheckCircle2 size={28} /></div>
                <div className="heading-display text-2xl mt-5 text-slate-900 dark:text-white">Thanks! Message received.</div>
                <div className="text-slate-500 mt-2 text-sm">Our team will reach out within one business day.</div>
              </div>
            ) : <>
              <h2 className="heading-display text-2xl text-slate-900 dark:text-white">Get in touch</h2>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Name</span><input required className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Institution</span><input required className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</span><input required type="email" className="w-full mt-1.5" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">How can we help?</span><textarea rows={4} className="w-full mt-1.5" placeholder="Tell us about your institution…" /></label>
              <button className="btn-primary w-full inline-flex items-center justify-center gap-2">Send message <Send size={15} /></button>
            </>}
          </form>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
