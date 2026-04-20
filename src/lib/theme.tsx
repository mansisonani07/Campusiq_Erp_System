import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeName = 'Pearl Light' | 'Deep Space Dark';

interface ThemeCtx {
  theme: Theme;
  name: ThemeName;
  toggle: (e?: React.MouseEvent) => void;
  set: (t: Theme, e?: React.MouseEvent) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: 'light',
  name: 'Pearl Light',
  toggle: () => {},
  set: () => {},
});

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function runRipple(x: number, y: number) {
  if (typeof document === 'undefined') return;
  const r = document.createElement('div');
  r.className = 'theme-ripple';
  r.style.setProperty('--ripple-x', `${x}px`);
  r.style.setProperty('--ripple-y', `${y}px`);
  // Fill with inverted background so the reveal reads
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim();
  r.style.background = bg || '';
  document.body.appendChild(r);
  window.setTimeout(() => r.remove(), 720);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('campusiq-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply before paint to prevent flash
  useEffect(() => { applyThemeClass(theme); }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('campusiq-theme', theme); } catch {}
  }, [theme]);

  const set = useCallback((t: Theme, e?: React.MouseEvent) => {
    if (t === theme) return;
    if (e && typeof document !== 'undefined') {
      // Paint the next theme first so the ripple reveals it
      const x = e.clientX; const y = e.clientY;
      runRipple(x, y);
      window.requestAnimationFrame(() => { setTheme(t); });
    } else {
      setTheme(t);
    }
  }, [theme]);

  const toggle = useCallback((e?: React.MouseEvent) => {
    set(theme === 'light' ? 'dark' : 'light', e);
  }, [theme, set]);

  const name: ThemeName = theme === 'light' ? 'Pearl Light' : 'Deep Space Dark';

  return (
    <Ctx.Provider value={{ theme, name, toggle, set }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
