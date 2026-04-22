import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Role = 'student' | 'faculty' | 'parent' | 'admin';
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  department?: string;
  /** Student: own id. Parent: ward's studentId for data scoping. */
  studentId?: string;
  program?: string;
  semester?: number;
}

interface SessionCtx {
  user: SessionUser | null;
  login: (u: SessionUser) => void;
  logout: () => void;
}

const Ctx = createContext<SessionCtx>({ user: null, login: () => {}, logout: () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('campusiq-session');
    return raw ? JSON.parse(raw) : null;
  });
  useEffect(() => {
    if (user) localStorage.setItem('campusiq-session', JSON.stringify(user));
    else localStorage.removeItem('campusiq-session');
  }, [user]);
  return <Ctx.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
