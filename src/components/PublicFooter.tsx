import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Github, Linkedin, Twitter, Mail, MapPin, Shield, Sparkles } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#050811]">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none"/>
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-14 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <Logo size={40}/>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 max-w-sm leading-relaxed">
            The unified academic operating system for modern colleges and institutes. Built by educators, for educators.
          </p>
          <div className="flex items-center gap-2 mt-5">
            {[Twitter, Linkedin, Github].map((I, i) => (
              <a key={i} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-gradient-to-br hover:from-cyan-500 hover:to-blue-600 transition-all" aria-label="social">
                <I size={15}/>
              </a>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="chip bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><Shield size={10}/> SOC 2 Type II</div>
            <div className="chip bg-cyan-500/10 text-cyan-600 border border-cyan-500/20"><Sparkles size={10}/> 99.99% uptime</div>
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold mb-4">Product</div>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/features" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Pricing</Link></li>
            <li><Link to="/about" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">About</Link></li>
            <li><Link to="/admissions" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Admissions</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold mb-4">Portals</div>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/login" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Student</Link></li>
            <li><Link to="/login" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Faculty</Link></li>
            <li><Link to="/login" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Parent</Link></li>
            <li><Link to="/login" className="text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Super admin</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold mb-4">Contact</div>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2"><Mail size={13} className="text-cyan-500"/>immpatel07@gmail.com </li>
            <li className="flex items-center gap-2"><MapPin size={13} className="text-cyan-500"/> india</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-slate-200 dark:border-slate-800/80 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-xs text-slate-500">© {new Date().getFullYear()} Mansi Sonani. All rights reserved.</div>
        <div className="text-xs text-slate-500 flex gap-4">
          <a className="hover:text-cyan-500">Privacy</a>
          <a className="hover:text-cyan-500">Terms</a>
          <a className="hover:text-cyan-500">Security</a>
        </div>
      </div>
    </footer>
  );
}
