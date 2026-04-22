import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useTheme } from '../lib/theme';
import { Moon, Sun, Menu, X, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PublicNav() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = [
    { to: '/features', label: 'Features' },
    { to: '/about', label: 'About' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/admissions', label: 'Admissions' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'bg-white/85 dark:bg-[#050811]/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-[68px] flex items-center justify-between">
        <Link to="/" className="shrink-0"><Logo size={36} /></Link>
        <nav className="hidden lg:flex items-center gap-1 mx-auto">
          {items.map(i => (
            <NavLink key={i.to} to={i.to}
              className={({ isActive }) => `px-3.5 py-2 text-[13.5px] font-semibold rounded-lg transition-colors ${isActive ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/8' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={(e) => toggle(e)} aria-label="Toggle theme" title={theme === 'light' ? 'Switch to Deep Space Dark' : 'Switch to Pearl Light'} className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <button onClick={() => navigate('/login')} className="hidden sm:inline-flex btn-ghost">Sign in</button>
          <button onClick={() => navigate('/admissions')} className="btn-primary inline-flex items-center gap-1.5">
            Apply <ArrowRight size={14} />
          </button>
          <button onClick={() => setOpen(v => !v)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60">{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#050811] px-4 py-3 flex flex-col gap-0.5">
          {items.map(i => <NavLink key={i.to} to={i.to} onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold">{i.label}</NavLink>)}
          <NavLink to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm rounded-lg text-cyan-600 font-bold">Sign in →</NavLink>
        </div>
      )}
    </header>
  );
}
