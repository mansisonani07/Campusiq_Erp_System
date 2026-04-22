import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Home, Users, BookOpen, Calendar, CreditCard, FileText, GraduationCap, ClipboardList, Library, Building2, Bus, Briefcase, DollarSign, Bell, BarChart3, FilesIcon, MessageSquare, Workflow, Settings, Moon, Sun, LogOut, Search, Menu, X, Shield, ChevronRight, ShieldCheck, type LucideIcon } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../lib/theme';
import { useSession } from '../lib/session';
import { can, roleLabel, type Resource } from '../lib/rbac';
import Chatbot from './Chatbot';
import OmniSearch from './OmniSearch';

interface NavItem { to: string; label: string; icon: LucideIcon; section: string; resource: Resource; }

const ALL_ITEMS: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: Home, section: 'Overview', resource: 'dashboard' },
  { to: '/app/timetable', label: 'Timetable', icon: Calendar, section: 'Academic', resource: 'timetable' },
  { to: '/app/attendance', label: 'Attendance', icon: ClipboardList, section: 'Academic', resource: 'attendance' },
  { to: '/app/assignments', label: 'Assignments', icon: FileText, section: 'Academic', resource: 'assignments' },
  { to: '/app/exams', label: 'Exams & Grades', icon: GraduationCap, section: 'Academic', resource: 'exams' },
  { to: '/app/lms', label: 'Learning Portal', icon: BookOpen, section: 'Academic', resource: 'lms' },
  { to: '/app/students', label: 'Students', icon: Users, section: 'People', resource: 'students' },
  { to: '/app/faculty', label: 'Faculty & HR', icon: Briefcase, section: 'People', resource: 'faculty' },
  { to: '/app/admissions', label: 'Admissions', icon: GraduationCap, section: 'People', resource: 'admissions' },
  { to: '/app/courses', label: 'Courses', icon: BookOpen, section: 'People', resource: 'courses' },
  { to: '/app/fees', label: 'Fees', icon: CreditCard, section: 'Finance', resource: 'fees' },
  { to: '/app/payroll', label: 'Payroll', icon: DollarSign, section: 'Finance', resource: 'payroll' },
  { to: '/app/library', label: 'Library', icon: Library, section: 'Operations', resource: 'library' },
  { to: '/app/hostel', label: 'Hostel', icon: Building2, section: 'Operations', resource: 'hostel' },
  { to: '/app/transport', label: 'Transport', icon: Bus, section: 'Operations', resource: 'transport' },
  { to: '/app/workflows', label: 'Approvals', icon: Workflow, section: 'Operations', resource: 'workflows' },
  { to: '/app/account-approvals', label: 'Account Approvals', icon: ShieldCheck, section: 'Operations', resource: 'account_approvals' },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3, section: 'Insights', resource: 'analytics' },
  { to: '/app/reports', label: 'Reports', icon: FileText, section: 'Insights', resource: 'reports' },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, section: 'Workspace', resource: 'notifications' },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare, section: 'Workspace', resource: 'messages' },
  { to: '/app/documents', label: 'Documents', icon: FilesIcon, section: 'Workspace', resource: 'documents' },
  { to: '/app/settings', label: 'Settings', icon: Settings, section: 'Workspace', resource: 'settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const items = useMemo(() => {
    if (!user) return [];
    return ALL_ITEMS.filter(i => can(user.role, i.resource, 'view'));
  }, [user]);
  const sections = useMemo(() => Array.from(new Set(items.map(i => i.section))), [items]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const roleBadge = ({
    student: { label: 'Student', color: 'from-cyan-500 to-teal-500' },
    faculty: { label: 'Faculty', color: 'from-blue-500 to-indigo-600' },
    parent: { label: 'Parent', color: 'from-violet-500 to-purple-600' },
    admin: { label: 'Super Admin', color: 'from-rose-500 to-orange-500' },
  } as const)[user.role];

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)]">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-[270px] shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} bg-[var(--sidebar-bg)] border-r border-[var(--border-subtle)] flex flex-col`}>
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <Logo size={36} />
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--border-subtle)]" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        {/* User card */}
        <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleBadge.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
              {user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">{user.name}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-700)] dark:text-[var(--brand-300)] flex items-center gap-1">
                <ShieldCheck size={10} /> {roleLabel(user.role)}
              </div>
            </div>
          </div>
        </div>
        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5" aria-label="Primary navigation">
          {sections.map(section => (
            <div key={section}>
              <div className="px-2.5 mb-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--text-tertiary)]">{section}</div>
              <div className="space-y-0.5">
                {items.filter(i => i.section === section).map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} end={to === '/app/dashboard'}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold transition-all relative ${isActive ? 'nav-pill-active' : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]'}`}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
          <button onClick={(e) => toggle(e)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)]">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Deep Space Dark' : 'Pearl Light'}</span>
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-[var(--bg-elevated)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[var(--border-subtle)]" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-tertiary)]">
              <span>CampusIQ</span>
              <ChevronRight size={13} className="text-slate-400" />
              <span className="capitalize text-[var(--text-primary)]">{location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}</span>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              {/* Role-aware search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="group hidden sm:flex items-center gap-2 w-full max-w-[360px] pl-3 pr-2 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-brand)] transition-colors text-left"
                aria-label="Open global search"
              >
                <Search size={15} className="text-[var(--text-tertiary)] group-hover:text-cyan-500 transition-colors" />
                <span className="text-[13px] text-[var(--text-tertiary)] flex-1 truncate">Search {roleLabel(user.role).toLowerCase()} records…</span>
                <kbd className="text-[10px] mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">⌘K</kbd>
              </button>
              <button onClick={() => setSearchOpen(true)} className="sm:hidden p-2 rounded-lg hover:bg-[var(--border-subtle)]" aria-label="Search">
                <Search size={17} />
              </button>
              <button className="relative p-2 rounded-lg hover:bg-[var(--border-subtle)]" onClick={() => navigate('/app/notifications')} aria-label="Notifications">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 pulse-dot" />
              </button>
              <div className="hidden sm:flex items-center gap-1.5 chip bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                <Shield size={10} />
                <span>{roleLabel(user.role)}</span>
              </div>
              <button onClick={(e) => toggle(e)} className="p-2 rounded-lg hover:bg-[var(--border-subtle)]" aria-label="Toggle theme" title={theme === 'light' ? 'Switch to Deep Space Dark' : 'Switch to Pearl Light'}>
                {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <div className="fade-up">{children}</div>
        </main>
      </div>

      <Chatbot />
      <OmniSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
