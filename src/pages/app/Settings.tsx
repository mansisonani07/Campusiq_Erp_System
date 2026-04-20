import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Tilt from '../../components/Tilt';
import { useSession } from '../../lib/session';
import { useTheme } from '../../lib/theme';
import { can } from '../../lib/rbac';
import { api } from '../../lib/api';
import {
  Settings as Cog, Bell, Shield, Moon, Sun, Globe, Mail, Smartphone, LogOut, Key,
  Languages, Palette, CreditCard, Lock, User, MapPin, AtSign, Image as ImageIcon,
  Send, CheckCircle2, Clock, XCircle, History, ShieldCheck, AlertCircle, Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Changes = Record<string, { from: string; to: string }>;

interface ProfileRequest {
  id: number;
  user_email: string;
  user_name: string;
  role: string;
  changes: Changes;
  note?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_name?: string | null;
  reviewer_comment?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
}

const EDITABLE_FIELDS = [
  { key: 'profile_photo', label: 'Profile photo', icon: ImageIcon, help: 'Upload a new avatar (JPG or PNG)' },
  { key: 'nickname', label: 'Nickname', icon: User, help: 'A short, friendly display name' },
  { key: 'contact_email', label: 'Contact email', icon: AtSign, help: 'Alternate email for notifications' },
  { key: 'address', label: 'Address', icon: MapPin, help: 'Current permanent residence' },
] as const;

type FieldKey = typeof EDITABLE_FIELDS[number]['key'];

function parseChanges(c: any): Changes {
  if (!c) return {};
  if (typeof c === 'string') { try { return JSON.parse(c); } catch { return {}; } }
  return c as Changes;
}

export default function SettingsPage() {
  const { user, logout } = useSession();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const isAdmin = user ? can(user.role, 'settings') && user.role === 'admin' : false;

  // Current (approved) values on the profile
  const initialProfile = useMemo(() => ({
    profile_photo: 'initials',
    nickname: (user?.name || '').split(' ')[0] || '',
    contact_email: user?.email || '',
    address: 'Campus residential address on file',
  } as Record<FieldKey, string>), [user]);

  // Draft values edited in-form
  const [draft, setDraft] = useState<Record<FieldKey, string>>(initialProfile);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  // Requests (own + admin queue)
  const [myRequests, setMyRequests] = useState<ProfileRequest[]>([]);
  const [allPending, setAllPending] = useState<ProfileRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true, in_app: true });

  useEffect(() => { setDraft(initialProfile); }, [initialProfile]);

  const load = async () => {
    if (!user) return;
    setLoadingReqs(true);
    try {
      const mine = await api<ProfileRequest[]>(`/api/profile_requests?user_email=${encodeURIComponent(user.email)}`);
      setMyRequests(mine.map(r => ({ ...r, changes: parseChanges(r.changes) })));
      if (isAdmin) {
        const all = await api<ProfileRequest[]>('/api/profile_requests?status=pending');
        setAllPending(all.map(r => ({ ...r, changes: parseChanges(r.changes) })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReqs(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.email, isAdmin]);

  // Lock fields while a pending request touches them
  const lockedFields = useMemo(() => {
    const locked = new Set<FieldKey>();
    for (const r of myRequests) {
      if (r.status !== 'pending') continue;
      Object.keys(r.changes).forEach(k => locked.add(k as FieldKey));
    }
    return locked;
  }, [myRequests]);

  const diff: Changes = useMemo(() => {
    const out: Changes = {};
    EDITABLE_FIELDS.forEach(f => {
      if ((draft[f.key] ?? '') !== (initialProfile[f.key] ?? '')) {
        out[f.key] = { from: initialProfile[f.key] ?? '', to: draft[f.key] ?? '' };
      }
    });
    return out;
  }, [draft, initialProfile]);

  const hasChanges = Object.keys(diff).length > 0;

  const submitRequest = async () => {
    if (!user || !hasChanges) return;
    setSubmitting(true);
    try {
      await api('/api/profile_requests', {
        method: 'POST',
        body: JSON.stringify({
          user_email: user.email,
          user_name: user.name,
          role: user.role,
          changes: diff,
          note,
        }),
      });
      setToast({ t: 'ok', m: 'Request submitted for administrative approval.' });
      setNote('');
      await load();
    } catch (e: any) {
      setToast({ t: 'err', m: e.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const decide = async (id: number, status: 'approved' | 'rejected', comment: string) => {
    if (!user) return;
    await api('/api/profile_requests', {
      method: 'PUT',
      body: JSON.stringify({ id, status, reviewer_name: user.name, reviewer_comment: comment }),
    });
    await load();
  };

  const cancelRequest = async (id: number) => {
    await api('/api/profile_requests', { method: 'DELETE', body: JSON.stringify({ id }) });
    await load();
  };

  if (!user) return null;

  const avatar = user.name.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Profile, preferences, notifications and security"
        icon={<Cog size={22} />}
      />

      {toast && (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 border ${toast.t === 'ok' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'}`}>
          {toast.t === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.m}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Identity card */}
        <Tilt max={6} scale={1.01} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-6 h-full card-gradient-border">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white font-black flex items-center justify-center text-xl shadow-lg">
                {avatar}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg truncate text-[var(--text-primary)]">{user.name}</div>
                <div className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</div>
                <div className="chip bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 mt-1.5 inline-flex">
                  <ShieldCheck size={10} /> {user.role === 'admin' ? 'Super Admin' : user.role}
                </div>
              </div>
            </div>

            {user.studentId && (
              <div className="mt-5 p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[12.5px] space-y-1">
                <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Student ID</span><span className="font-bold mono">{user.studentId}</span></div>
                {user.program && <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Program</span><span className="font-bold">{user.program}</span></div>}
                {user.semester && <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Semester</span><span className="font-bold">{user.semester}</span></div>}
              </div>
            )}
            {user.department && (
              <div className="mt-5 p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[12.5px] flex justify-between">
                <span className="text-[var(--text-tertiary)]">Department</span>
                <span className="font-bold">{user.department}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="chip bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"><ShieldCheck size={10} /> Verified</div>
              <div className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25"><Lock size={10} /> 2FA on</div>
            </div>

            <button onClick={() => { logout(); nav('/login'); }} className="mt-5 w-full bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg py-2.5 font-semibold text-sm inline-flex items-center justify-center gap-2 border border-rose-500/25 transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </Tilt>

        <div className="lg:col-span-2 space-y-5">
          {/* PROFILE UPDATE REQUEST */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <div className="section-title flex items-center gap-2"><Pencil size={14} className="text-cyan-500" /> Profile Update Request</div>
                <div className="section-sub">Edit non-permanent fields — changes are queued for administrative approval before being applied.</div>
              </div>
              <div className="chip bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"><Clock size={10} /> Requires approval</div>
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-3">
              {EDITABLE_FIELDS.map(f => {
                const Icon = f.icon;
                const locked = lockedFields.has(f.key);
                return (
                  <label key={f.key} className={`block relative p-3.5 rounded-xl bg-[var(--bg-inset)] border ${locked ? 'border-amber-500/40' : 'border-[var(--border-subtle)]'} transition-colors`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-[12px] font-bold">
                        <Icon size={12} className="text-cyan-500" />
                        {f.label}
                      </div>
                      {locked && <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-300"><Clock size={9} /> Pending</span>}
                    </div>
                    <div className="text-[10.5px] text-[var(--text-tertiary)] mt-0.5">{f.help}</div>
                    {f.key === 'profile_photo' ? (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-xs">
                          {avatar}
                        </div>
                        <input
                          type="text"
                          disabled={locked}
                          value={draft.profile_photo === 'initials' ? '' : draft.profile_photo.replace(/^uploaded:/, '')}
                          placeholder="avatar.png (simulated upload)"
                          onChange={e => setDraft(d => ({ ...d, profile_photo: e.target.value ? `uploaded:${e.target.value}` : 'initials' }))}
                          className="!py-2 !text-[13px] flex-1 disabled:opacity-60"
                        />
                      </div>
                    ) : (
                      <input
                        type={f.key === 'contact_email' ? 'email' : 'text'}
                        disabled={locked}
                        value={draft[f.key]}
                        onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                        className="mt-2 !py-2 !text-[13px] w-full disabled:opacity-60"
                      />
                    )}
                  </label>
                );
              })}
            </div>

            <label className="block mt-3">
              <span className="eyebrow">Note for the reviewer (optional)</span>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Provide context that helps the administrator approve your request…"
                className="mt-1.5 !text-[13px] w-full"
              />
            </label>

            {/* Diff preview */}
            {hasChanges && (
              <div className="mt-4 p-3.5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                <div className="eyebrow-strong text-cyan-700 dark:text-cyan-300 mb-2">Pending changes</div>
                <div className="space-y-1.5">
                  {Object.entries(diff).map(([k, v]) => (
                    <div key={k} className="text-[12.5px] flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold capitalize text-[var(--text-primary)]">{k.replace('_', ' ')}:</span>
                      <span className="text-rose-600 dark:text-rose-400 line-through mono text-[11.5px]">{v.from || '—'}</span>
                      <span className="text-[var(--text-tertiary)]">→</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold mono text-[11.5px]">{v.to || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="text-[11.5px] text-[var(--text-tertiary)] inline-flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-500" />
                Submitted changes will show as pending until an administrator reviews them.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setDraft(initialProfile); setNote(''); }}
                  disabled={!hasChanges || submitting}
                  className="btn-ghost disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  onClick={submitRequest}
                  disabled={!hasChanges || submitting}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <Send size={13} /> {submitting ? 'Submitting…' : 'Submit for approval'}
                </button>
              </div>
            </div>
          </div>

          {/* MY REQUEST HISTORY */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={14} className="text-cyan-500" />
              <div className="section-title">My recent requests</div>
            </div>
            {loadingReqs ? (
              <div className="text-sm text-[var(--text-tertiary)] py-4">Loading…</div>
            ) : myRequests.length === 0 ? (
              <div className="text-sm text-[var(--text-tertiary)] py-4">No requests yet. Your future profile changes will appear here.</div>
            ) : (
              <div className="space-y-2.5">
                {myRequests.map(r => {
                  const statusClass = r.status === 'approved'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                    : r.status === 'rejected'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25';
                  const Icon = r.status === 'approved' ? CheckCircle2 : r.status === 'rejected' ? XCircle : Clock;
                  return (
                    <div key={r.id} className="p-4 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] border-l-4" style={{ borderLeftColor: r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className={`chip inline-flex items-center gap-1 ${statusClass}`}>
                          <Icon size={10} /> {r.status}
                        </div>
                        <div className="text-[11px] text-[var(--text-tertiary)] mono">{new Date(r.submitted_at).toLocaleString()}</div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {Object.entries(r.changes).map(([k, v]) => (
                          <div key={k} className="text-[12.5px] flex items-baseline gap-2 flex-wrap">
                            <span className="font-bold capitalize text-[var(--text-primary)]">{k.replace('_', ' ')}:</span>
                            <span className="text-rose-600 dark:text-rose-400 line-through mono text-[11.5px]">{v.from || '—'}</span>
                            <span className="text-[var(--text-tertiary)]">→</span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-semibold mono text-[11.5px]">{v.to || '—'}</span>
                          </div>
                        ))}
                      </div>
                      {r.note && <div className="mt-2 text-[12px] text-[var(--text-secondary)] italic">"{r.note}"</div>}
                      {r.reviewer_comment && (
                        <div className="mt-2 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[12px]">
                          <div className="eyebrow-strong text-[10px] text-[var(--text-tertiary)] mb-1">Reviewer · {r.reviewer_name || 'Administrator'}</div>
                          <div className="text-[var(--text-primary)]">{r.reviewer_comment}</div>
                        </div>
                      )}
                      {r.status === 'pending' && (
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => cancelRequest(r.id)} className="text-[11.5px] text-rose-600 font-semibold hover:underline">Cancel request</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ADMIN QUEUE */}
          {isAdmin && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-rose-500" />
                  <div className="section-title">Admin approval queue</div>
                </div>
                <div className="chip bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">{allPending.length} pending</div>
              </div>
              {allPending.length === 0 ? (
                <div className="text-sm text-[var(--text-tertiary)] py-4">No pending profile requests. 🎉</div>
              ) : (
                <div className="space-y-3">
                  {allPending.map(r => <AdminReviewCard key={r.id} req={r} onDecide={decide} />)}
                </div>
              )}
            </div>
          )}

          {/* APPEARANCE + LANGUAGE */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Palette size={14} className="text-cyan-500" /><div className="section-title">Appearance</div></div>
            <button onClick={(e) => toggle(e)} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-inset)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] transition-colors">
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-blue-400" />}
                <span className="font-bold text-sm">{theme === 'light' ? 'Pearl Light' : 'Deep Space Dark'}</span>
              </div>
              <span className="chip bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">Click to toggle</span>
            </button>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="p-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] flex items-center gap-2 text-[12.5px]">
                <Languages size={13} className="text-[var(--text-tertiary)]" />
                <select className="flex-1 !py-1.5 !text-[13px] !bg-transparent !border-0 !shadow-none focus:!shadow-none"><option>English (US)</option><option>English (UK)</option><option>Hindi</option><option>Tamil</option><option>Kannada</option></select>
              </label>
              <label className="p-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] flex items-center gap-2 text-[12.5px]">
                <Globe size={13} className="text-[var(--text-tertiary)]" />
                <select className="flex-1 !py-1.5 !text-[13px] !bg-transparent !border-0 !shadow-none focus:!shadow-none"><option>IST (UTC+5:30)</option><option>UTC</option><option>EST</option><option>PST</option></select>
              </label>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Bell size={14} className="text-cyan-500" /><div className="section-title">Notifications</div></div>
            <div className="space-y-2">
              {([['email', 'Email notifications', Mail], ['sms', 'SMS alerts', Smartphone], ['push', 'Push notifications', Bell], ['in_app', 'In-app messages', Bell]] as const).map(([k, l, I]) => (
                <label key={k} className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3"><I size={14} className="text-[var(--text-secondary)]" /><span className="text-sm font-bold">{l}</span></div>
                  <input type="checkbox" className="!w-9 !h-5" checked={(notifs as any)[k]} onChange={e => setNotifs({ ...notifs, [k]: e.target.checked })} />
                </label>
              ))}
            </div>
          </div>

          {/* SECURITY */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Shield size={14} className="text-cyan-500" /><div className="section-title">Security</div></div>
            <div className="space-y-2">
              <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3"><Key size={14} className="text-[var(--text-secondary)]" /><span className="text-sm font-bold">Change password</span></div>
                <span className="text-xs text-[var(--text-tertiary)]">Last changed 42 days ago</span>
              </div>
              <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3"><Lock size={14} className="text-[var(--text-secondary)]" /><span className="text-sm font-bold">Two-factor authentication</span></div>
                <span className="chip bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">Enabled</span>
              </div>
              <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3"><Smartphone size={14} className="text-[var(--text-secondary)]" /><span className="text-sm font-bold">Active sessions</span></div>
                <span className="text-xs text-[var(--text-tertiary)]">3 devices</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4"><CreditCard size={14} className="text-cyan-500" /><div className="section-title">Billing & plan</div></div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="relative">
                  <div className="text-xs uppercase tracking-wider opacity-85 font-bold">Current plan</div>
                  <div className="heading-display text-3xl mt-1">Institute Edition</div>
                  <div className="text-sm opacity-90 mt-1">12,486 / 15,000 students · renews 12 Mar 2026</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminReviewCard({ req, onDecide }: { req: ProfileRequest; onDecide: (id: number, status: 'approved' | 'rejected', comment: string) => void }) {
  const [comment, setComment] = useState('');
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] border-l-4 border-l-amber-500">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-[var(--text-primary)] truncate">{req.user_name}</div>
          <div className="text-[11.5px] text-[var(--text-tertiary)]">{req.user_email} · {req.role}</div>
        </div>
        <div className="text-[11px] text-[var(--text-tertiary)] mono">{new Date(req.submitted_at).toLocaleString()}</div>
      </div>
      <div className="mt-2 space-y-1">
        {Object.entries(req.changes).map(([k, v]) => (
          <div key={k} className="text-[12.5px] flex items-baseline gap-2 flex-wrap">
            <span className="font-bold capitalize text-[var(--text-primary)]">{k.replace('_', ' ')}:</span>
            <span className="text-rose-600 dark:text-rose-400 line-through mono text-[11.5px]">{v.from || '—'}</span>
            <span className="text-[var(--text-tertiary)]">→</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold mono text-[11.5px]">{v.to || '—'}</span>
          </div>
        ))}
      </div>
      {req.note && <div className="mt-2 text-[12px] text-[var(--text-secondary)] italic">"{req.note}"</div>}
      <div className="mt-3 flex gap-2 flex-wrap">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a reviewer comment (optional)…"
          className="flex-1 min-w-[180px] !py-2 !text-[13px]"
        />
        <button onClick={() => onDecide(req.id, 'rejected', comment || 'Rejected by administrator.')} className="bg-rose-500/10 text-rose-600 border border-rose-500/25 rounded-lg px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1 hover:bg-rose-500/20">
          <XCircle size={13} /> Reject
        </button>
        <button onClick={() => onDecide(req.id, 'approved', comment || 'Approved and applied.')} className="btn-primary !py-2 !px-3.5 text-xs inline-flex items-center gap-1">
          <CheckCircle2 size={13} /> Approve & apply
        </button>
      </div>
    </div>
  );
}
