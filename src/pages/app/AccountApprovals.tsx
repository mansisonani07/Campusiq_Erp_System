import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Tilt from '../../components/Tilt';
import Loader from '../../components/Loader';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, User, Mail, GraduationCap,
  Search, AlertTriangle, Pencil, UserPlus, Inbox, History, FileText,
} from 'lucide-react';

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

interface Account {
  id: number;
  email: string;
  full_name: string;
  role: string;
  student_id?: string | null;
  program?: string | null;
  status: 'active' | 'pending_approval' | 'rejected' | 'suspended';
  institution?: string | null;
  created_at: string;
}

type TabKey = 'pending' | 'registrations' | 'approved' | 'rejected' | 'accounts';

function parseChanges(c: any): Changes {
  if (!c) return {};
  if (typeof c === 'string') { try { return JSON.parse(c); } catch { return {}; } }
  return c as Changes;
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    pending: { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25', icon: Clock, label: 'Pending' },
    pending_approval: { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25', icon: Clock, label: 'Pending' },
    approved: { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25', icon: CheckCircle2, label: 'Approved' },
    active: { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25', icon: CheckCircle2, label: 'Active' },
    rejected: { cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25', icon: XCircle, label: 'Rejected' },
    suspended: { cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/25', icon: AlertTriangle, label: 'Suspended' },
  };
  const m = map[s] || map.pending;
  const I = m.icon;
  return (
    <span className={`chip border ${m.cls} inline-flex items-center gap-1`}><I size={10} />{m.label}</span>
  );
}

export default function AccountApprovals() {
  const { user } = useSession();
  const [tab, setTab] = useState<TabKey>('pending');
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<ProfileRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProfileRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErr, setRejectErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [approveComment, setApproveComment] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [reqs, accs] = await Promise.all([
        api<ProfileRequest[]>('/api/profile_requests'),
        api<Account[]>('/api/accounts').catch(() => []),
      ]);
      const normalized = reqs.map(r => ({ ...r, changes: parseChanges(r.changes) }));
      setRequests(normalized);
      setAccounts(Array.isArray(accs) ? accs : []);
      if (selected) {
        const refreshed = normalized.find(r => r.id === selected.id) || null;
        setSelected(refreshed);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const counts = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    registrations: requests.filter(r => r.status === 'pending' && !!r.changes?.registration).length,
    accounts: accounts.length,
  }), [requests, accounts]);

  const visibleRequests = useMemo(() => {
    let list = requests;
    if (tab === 'pending') list = list.filter(r => r.status === 'pending');
    else if (tab === 'approved') list = list.filter(r => r.status === 'approved');
    else if (tab === 'rejected') list = list.filter(r => r.status === 'rejected');
    else if (tab === 'registrations') list = list.filter(r => !!r.changes?.registration);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(r =>
        r.user_name.toLowerCase().includes(needle) ||
        r.user_email.toLowerCase().includes(needle) ||
        r.role.toLowerCase().includes(needle) ||
        Object.keys(r.changes || {}).join(' ').toLowerCase().includes(needle)
      );
    }
    return list.slice().sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }, [requests, tab, q]);

  const visibleAccounts = useMemo(() => {
    if (!q.trim()) return accounts;
    const needle = q.toLowerCase();
    return accounts.filter(a =>
      a.full_name.toLowerCase().includes(needle) ||
      a.email.toLowerCase().includes(needle) ||
      (a.student_id || '').toLowerCase().includes(needle) ||
      a.role.toLowerCase().includes(needle));
  }, [accounts, q]);

  const approve = async (r: ProfileRequest) => {
    setSaving(true);
    try {
      await api('/api/profile_requests', {
        method: 'PUT',
        body: JSON.stringify({
          id: r.id,
          status: 'approved',
          reviewer_name: user?.name || 'Admin',
          reviewer_comment: approveComment.trim() || 'Approved.',
        }),
      });
      // If this is a registration request, activate the corresponding account.
      if (r.changes?.registration) {
        try {
          const acc = await api<any>(`/api/accounts?email=${encodeURIComponent(r.user_email)}`);
          if (acc?.id) {
            await api('/api/accounts', { method: 'PUT', body: JSON.stringify({ id: acc.id, status: 'active' }) });
          }
        } catch { }
      }
      setApproveComment('');
      setSelected(null);
      await load();
    } finally { setSaving(false); }
  };

  const commitReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 8) {
      setRejectErr('Rejection reason is required (min 8 characters).');
      return;
    }
    setSaving(true);
    try {
      await api('/api/profile_requests', {
        method: 'PUT',
        body: JSON.stringify({
          id: rejectTarget.id,
          status: 'rejected',
          reviewer_name: user?.name || 'Admin',
          reviewer_comment: rejectReason.trim(),
        }),
      });
      // If registration, flip the account status
      if (rejectTarget.changes?.registration) {
        try {
          const acc = await api<any>(`/api/accounts?email=${encodeURIComponent(rejectTarget.user_email)}`);
          if (acc?.id) {
            await api('/api/accounts', { method: 'PUT', body: JSON.stringify({ id: acc.id, status: 'rejected' }) });
          }
        } catch { }
      }
      setRejectTarget(null);
      setRejectReason('');
      setRejectErr('');
      setSelected(null);
      await load();
    } finally { setSaving(false); }
  };

  const updateAccountStatus = async (id: number, status: Account['status']) => {
    await api('/api/accounts', { method: 'PUT', body: JSON.stringify({ id, status }) });
    await load();
  };

  if (loading) return <div className="p-8"><Loader label="Loading approval queue…" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Account Approvals"
        subtitle="Review new registrations and profile change requests"
        icon={<ShieldCheck size={22} />}
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5 stagger">
        {[
          { k: 'pending' as TabKey, l: 'Pending review', v: counts.pending, c: 'from-amber-500 to-orange-500', i: Clock },
          { k: 'registrations' as TabKey, l: 'New registrations', v: counts.registrations, c: 'from-cyan-500 to-teal-500', i: UserPlus },
          { k: 'approved' as TabKey, l: 'Approved', v: counts.approved, c: 'from-emerald-500 to-teal-600', i: CheckCircle2 },
          { k: 'rejected' as TabKey, l: 'Rejected', v: counts.rejected, c: 'from-rose-500 to-pink-600', i: XCircle },
          { k: 'accounts' as TabKey, l: 'Total accounts', v: counts.accounts, c: 'from-blue-500 to-indigo-600', i: User },
        ].map(s => {
          const I = s.i;
          const active = tab === s.k;
          return (
            <Tilt key={s.k} max={8} scale={1.015} className="rounded-2xl">
              <button onClick={() => setTab(s.k)} className={`w-full text-left p-4 rounded-2xl border transition-colors ${active ? 'bg-gradient-to-br ' + s.c + ' text-white border-transparent shadow-lg' : 'glass-card border-[var(--border-subtle)]'}`}>
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-gradient-to-br ' + s.c + ' text-white'}`}><I size={16} /></div>
                  {active && <span className="chip bg-white/20 text-white">Active</span>}
                </div>
                <div className="heading-display text-3xl mt-3">{s.v}</div>
                <div className={`text-[11px] uppercase tracking-widest font-bold mt-0.5 ${active ? 'text-white/85' : 'text-slate-500'}`}>{s.l}</div>
              </button>
            </Tilt>
          );
        })}
      </div>

      {/* Search + tabs */}
      <div className="glass-card rounded-2xl p-4 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'accounts' ? 'Search name, email, student id…' : 'Search applicant, email, role…'} className="!pl-9 w-full" />
        </div>
        <div className="flex gap-1.5 bg-[var(--bg-inset)] p-1 rounded-xl overflow-x-auto">
          {(['pending', 'registrations', 'approved', 'rejected', 'accounts'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors whitespace-nowrap ${tab === t ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-[var(--text-primary)]'}`}>
              {t === 'pending' && 'Pending'}
              {t === 'registrations' && 'Registrations'}
              {t === 'approved' && 'Approved'}
              {t === 'rejected' && 'Rejected'}
              {t === 'accounts' && 'All Accounts'}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'accounts' ? (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4 items-start">
          {/* List */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="text-[13px] font-bold text-[var(--text-primary)]">{visibleRequests.length} request{visibleRequests.length !== 1 ? 's' : ''}</div>
              <span className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25"><Inbox size={10} /> Queue</span>
            </div>
            <div className="max-h-[640px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {visibleRequests.length === 0 && (
                <div className="p-10 text-center text-sm text-slate-500">No requests in this view.</div>
              )}
              {visibleRequests.map(r => {
                const isReg = !!r.changes?.registration;
                const active = selected?.id === r.id;
                const keys = Object.keys(r.changes || {});
                return (
                  <button key={r.id} onClick={() => setSelected(r)} className={`w-full text-left p-4 transition-colors ${active ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10' : 'hover:bg-[var(--border-subtle)]'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${isReg ? 'from-cyan-500 to-teal-500' : 'from-blue-500 to-indigo-600'} shadow-sm`}>
                        {isReg ? <UserPlus size={16} /> : <Pencil size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">{r.user_name}</div>
                          <StatusBadge s={r.status} />
                        </div>
                        <div className="text-[11.5px] text-slate-500 truncate">{r.user_email} · <span className="capitalize">{r.role}</span></div>
                        <div className="mt-1.5 text-[11.5px] text-[var(--text-secondary)]">
                          {isReg ? 'New account registration' : `${keys.length} field${keys.length !== 1 ? 's' : ''} changed${keys.length ? ': ' : ''}`}
                          {!isReg && keys.slice(0, 2).map(k => <span key={k} className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300 ml-1">{k.replace(/_/g, ' ')}</span>)}
                        </div>
                      </div>
                      <div className="text-[10.5px] text-slate-400 mono whitespace-nowrap">{timeAgo(r.submitted_at)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:sticky lg:top-24">
            {selected ? (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0">
                        <User size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="heading-display text-xl text-[var(--text-primary)] truncate">{selected.user_name}</div>
                        <div className="text-[12px] text-slate-500 flex items-center gap-1.5 truncate"><Mail size={11} />{selected.user_email}</div>
                      </div>
                    </div>
                    <StatusBadge s={selected.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px]">
                    <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300 capitalize">{selected.role}</span>
                    <span className="chip bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">Submitted {timeAgo(selected.submitted_at)}</span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Change diff */}
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><FileText size={11} /> Proposed changes</div>
                    <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                      {Object.entries(selected.changes || {}).map(([k, v], i, arr) => (
                        <div key={k} className={`p-3 ${i !== arr.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">{k.replace(/_/g, ' ')}</div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-lg bg-rose-500/8 border border-rose-500/20">
                              <div className="text-[10px] uppercase font-bold text-rose-600 mb-0.5">From</div>
                              <div className="text-[13px] text-[var(--text-primary)] break-words">{String(v.from || '—')}</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                              <div className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">To</div>
                              <div className="text-[13px] text-[var(--text-primary)] break-words">{String(v.to || '—')}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected.note && (
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Applicant note</div>
                      <div className="p-3 rounded-xl bg-[var(--bg-inset)] text-[13px] text-[var(--text-primary)] italic">"{selected.note}"</div>
                    </div>
                  )}

                  {selected.status === 'pending' ? (
                    <>
                      <div>
                        <label className="block text-[10.5px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Reviewer comment (optional)</label>
                        <input value={approveComment} onChange={e => setApproveComment(e.target.value)} placeholder="e.g. Verified by academic office." className="w-full" />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button disabled={saving} onClick={() => approve(selected)} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button disabled={saving} onClick={() => { setRejectTarget(selected); setRejectReason(''); setRejectErr(''); }} className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-[13px] inline-flex items-center gap-2 shadow-md hover:brightness-110 disabled:opacity-60">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]">
                      <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5"><History size={11} /> Decision</div>
                      <div className="text-[13px] text-[var(--text-primary)]"><b>{selected.reviewer_name || 'Admin'}</b> · {selected.reviewed_at ? timeAgo(selected.reviewed_at) : '—'}</div>
                      {selected.reviewer_comment && <div className="text-[12.5px] text-[var(--text-secondary)] mt-1 italic">"{selected.reviewer_comment}"</div>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-inset)] text-slate-500 flex items-center justify-center mx-auto mb-3"><Inbox size={20} /></div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Select a request</div>
                <div className="text-xs text-slate-500 mt-1">Pick an item from the list to review the proposed changes and take action.</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ACCOUNTS TAB */
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10.5px] uppercase tracking-widest text-slate-500 bg-[var(--bg-inset)] font-bold">
                <tr>
                  <th className="text-left px-5 py-3.5">User</th>
                  <th className="text-left px-5 py-3.5">Role</th>
                  <th className="text-left px-5 py-3.5">Reference</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-left px-5 py-3.5">Joined</th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAccounts.map(a => (
                  <tr key={a.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {a.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold">{a.full_name}</div>
                          <div className="text-[11px] text-slate-500">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 capitalize">{a.role}</span></td>
                    <td className="px-5 py-3 mono text-[11px] text-slate-500">{a.student_id || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge s={a.status} /></td>
                    <td className="px-5 py-3 text-[12px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        {a.status !== 'active' && <button onClick={() => updateAccountStatus(a.id, 'active')} className="btn-ghost !py-1.5 !px-2.5 text-[11px] inline-flex items-center gap-1"><CheckCircle2 size={11} /> Activate</button>}
                        {a.status !== 'suspended' && <button onClick={() => updateAccountStatus(a.id, 'suspended')} className="btn-ghost !py-1.5 !px-2.5 text-[11px] inline-flex items-center gap-1"><AlertTriangle size={11} /> Suspend</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Reject dialog ===== */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none">
          <div className="modal-backdrop pointer-events-auto" onClick={() => !saving && setRejectTarget(null)} />
          <div className="relative pointer-events-auto w-full max-w-md glass-strong rounded-2xl overflow-hidden scale-in">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shrink-0"><XCircle size={18} /></div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-[var(--text-primary)]">Reject request</div>
                <div className="text-[11.5px] text-slate-500 truncate">{rejectTarget.user_name} · {rejectTarget.user_email}</div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Rejection reason <span className="text-rose-500">*</span>
                </span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={e => { setRejectReason(e.target.value); setRejectErr(''); }}
                  placeholder="Explain why this request is being rejected. This will be shared with the applicant."
                  className="w-full mt-1.5"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Shown to the applicant in their Settings · Request History.</span>
                  <span className={rejectReason.length < 8 ? 'text-rose-500' : 'text-emerald-500'}>{rejectReason.length}/8 min</span>
                </div>
              </label>
              {rejectErr && (
                <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-start gap-2">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{rejectErr}</span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button disabled={saving} onClick={() => setRejectTarget(null)} className="btn-ghost">Cancel</button>
                <button
                  disabled={saving || rejectReason.trim().length < 8}
                  onClick={commitReject}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-[13px] inline-flex items-center gap-2 shadow-md hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : <>Confirm rejection <XCircle size={14} /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
