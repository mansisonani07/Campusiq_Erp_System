import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import {
  Workflow, CheckCircle2, XCircle, Clock, User, AlertTriangle, Filter,
  MessageSquare, History, Send, ShieldCheck, UserPlus, FileEdit, ArrowRight,
  Inbox, FileText,
} from 'lucide-react';
import Loader from '../../components/Loader';
import Tilt from '../../components/Tilt';
import { useSession } from '../../lib/session';
import { can } from '../../lib/rbac';

type WF = {
  id: number; reference_no: string; request_type: string; title: string; description: string;
  requester_name: string; status: 'pending' | 'approved' | 'rejected'; current_step: number; total_steps: number;
  created_at: string;
};

type Approval = {
  id: number; workflow_id: number;
  action: 'submitted' | 'approved' | 'rejected' | 'comment';
  reason: string | null;
  actor: string; actor_role: string; created_at: string;
};

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

function iconFor(type: string) {
  if (/profile creation/i.test(type)) return UserPlus;
  if (/profile update|change/i.test(type)) return FileEdit;
  if (/document/i.test(type)) return FileText;
  if (/hostel/i.test(type)) return Workflow;
  if (/fee/i.test(type)) return Workflow;
  if (/leave/i.test(type)) return Workflow;
  if (/course/i.test(type)) return Workflow;
  if (/noc|internship/i.test(type)) return Workflow;
  return Workflow;
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

export default function Workflows() {
  const { user } = useSession();
  const [list, setList] = useState<WF[]>([]);
  const [history, setHistory] = useState<Record<number, Approval[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [selected, setSelected] = useState<WF | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WF | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErr, setRejectErr] = useState('');
  const [saving, setSaving] = useState(false);

  const canApprove = !!user && can(user.role, 'workflows', 'approve');
  const isStudent = user?.role === 'student' || user?.role === 'parent';

  const load = async () => {
    try {
      setLoading(true);
      const [wf, apr] = await Promise.all([
        api<WF[]>('/api/workflows'),
        api<Approval[]>('/api/approvals'),
      ]);
      // Scope: students/parents only see their own requests
      const scoped = isStudent && user
        ? wf.filter(w => w.requester_name.toLowerCase() === user.name.toLowerCase())
        : wf;
      setList(scoped);
      // Index history by workflow
      const map: Record<number, Approval[]> = {};
      apr.forEach(a => { (map[a.workflow_id] = map[a.workflow_id] || []).push(a); });
      Object.values(map).forEach(arr => arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      setHistory(map);
      // Keep selected in sync after reload
      if (selected) {
        const refreshed = scoped.find(x => x.id === selected.id) || null;
        setSelected(refreshed);
      } else if (scoped.length) {
        setSelected(scoped.find(x => x.status === 'pending') || scoped[0]);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const counts = useMemo(() => ({
    all: list.length,
    pending: list.filter(w => w.status === 'pending').length,
    approved: list.filter(w => w.status === 'approved').length,
    rejected: list.filter(w => w.status === 'rejected').length,
  }), [list]);

  const filtered = useMemo(() => {
    if (filter === 'all') return list;
    return list.filter(w => w.status === filter);
  }, [list, filter]);

  const approve = async (w: WF) => {
    setSaving(true);
    try {
      await api('/api/workflows', {
        method: 'PUT',
        body: JSON.stringify({ id: w.id, status: 'approved', current_step: w.total_steps }),
      });
      await api('/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: w.id, action: 'approved',
          reason: `Approved by ${user?.name}`,
          actor: user?.name, actor_role: user?.role,
          created_at: new Date().toISOString(),
        }),
      });
      await load();
    } finally { setSaving(false); }
  };

  const openReject = (w: WF) => { setRejectTarget(w); setRejectReason(''); setRejectErr(''); };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      setRejectErr('Rejection reason is required (minimum 10 characters) so the requester understands why.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/workflows', {
        method: 'PUT',
        body: JSON.stringify({ id: rejectTarget.id, status: 'rejected' }),
      });
      await api('/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: rejectTarget.id,
          action: 'rejected',
          reason,
          actor: user?.name,
          actor_role: user?.role,
          created_at: new Date().toISOString(),
        }),
      });
      setRejectTarget(null); setRejectReason('');
      await load();
    } finally { setSaving(false); }
  };

  const latestReject = (w: WF): Approval | undefined =>
    (history[w.id] || []).slice().reverse().find(a => a.action === 'rejected');

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title={canApprove ? 'Approval Dashboard' : 'My Requests'}
        subtitle={canApprove ? 'Review, approve or reject pending profile and change requests' : 'Track the status of requests you’ve submitted'}
        icon={<Workflow size={22} />}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 stagger">
        {[
          { k: 'pending', l: 'Pending review', v: counts.pending, c: 'from-amber-500 to-orange-500', i: Clock },
          { k: 'approved', l: 'Approved', v: counts.approved, c: 'from-emerald-500 to-teal-600', i: CheckCircle2 },
          { k: 'rejected', l: 'Rejected', v: counts.rejected, c: 'from-rose-500 to-pink-600', i: XCircle },
          { k: 'all', l: 'Total', v: counts.all, c: 'from-cyan-500 to-blue-600', i: Inbox },
        ].map(s => {
          const I = s.i;
          const active = filter === (s.k as Filter);
          return (
            <Tilt key={s.k} max={10} scale={1.02} className="rounded-2xl">
              <button
                onClick={() => setFilter(s.k as Filter)}
                className={`w-full text-left rounded-2xl p-5 text-white bg-gradient-to-br ${s.c} relative overflow-hidden elev-2 h-full transition-all ${active ? 'ring-2 ring-white/60 scale-[1.01]' : 'opacity-95 hover:opacity-100'}`}
              >
                <div className="absolute inset-0 bg-grid opacity-15" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-widest font-bold opacity-85">{s.l}</div>
                    <div className="heading-display text-4xl mt-2">{s.v}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/18 backdrop-blur-sm flex items-center justify-center"><I size={18} /></div>
                </div>
                {active && <div className="relative mt-3 text-[10px] uppercase tracking-widest font-bold opacity-90 inline-flex items-center gap-1">Filter active <ArrowRight size={11} /></div>}
              </button>
            </Tilt>
          );
        })}
      </div>

      {loading ? <Loader /> : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
          {/* List */}
          <div className="space-y-3 stagger">
            {filtered.length === 0 && (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 flex items-center justify-center mb-3"><Inbox size={22} /></div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Nothing here</div>
                <div className="text-xs text-slate-500 mt-1">No requests match the current filter.</div>
              </div>
            )}
            {filtered.map(w => {
              const Icon = iconFor(w.request_type);
              const rejected = latestReject(w);
              const hist = history[w.id] || [];
              const active = selected?.id === w.id;
              return (
                <div key={w.id} className={`glass-card rounded-2xl p-5 transition-all ${active ? 'ring-2 ring-cyan-500/40' : ''} hover-lift cursor-pointer`} onClick={() => setSelected(w)}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md shrink-0 ${w.status === 'approved' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : w.status === 'rejected' ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}`}><Icon size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">{w.request_type}</span>
                          <span className={`chip ${w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                              w.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                                'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>
                            {w.status === 'approved' && <CheckCircle2 size={9} />}
                            {w.status === 'rejected' && <XCircle size={9} />}
                            {w.status === 'pending' && <Clock size={9} />}
                            {w.status}
                          </span>
                          <span className="text-[11px] text-slate-500 mono">#{w.reference_no}</span>
                        </div>
                        <div className="font-bold text-[15px] mt-1.5 text-[var(--text-primary)]">{w.title}</div>
                        <div className="text-[13px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{w.description}</div>
                        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><User size={11} /> {w.requester_name}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(w.created_at)}</span>
                          <span className="flex items-center gap-1"><History size={11} /> {hist.length} event{hist.length === 1 ? '' : 's'}</span>
                          <span>Step {w.current_step}/{w.total_steps}</span>
                        </div>
                        {w.status === 'rejected' && rejected?.reason && (
                          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[12.5px] text-rose-700 dark:text-rose-300">
                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                            <div><b>Reason:</b> {rejected.reason} <span className="text-[10.5px] opacity-70 ml-1">· by {rejected.actor}</span></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {canApprove && w.status === 'pending' && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button disabled={saving} onClick={() => approve(w)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1 disabled:opacity-60"><CheckCircle2 size={12} /> Approve</button>
                        <button disabled={saving} onClick={() => openReject(w)} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1 disabled:opacity-60"><XCircle size={12} /> Reject</button>
                      </div>
                    )}
                  </div>

                  {/* Progress rail */}
                  <div className="mt-4 flex items-center gap-2">
                    {Array.from({ length: w.total_steps || 3 }).map((_, i) => (
                      <div key={i} className="flex-1">
                        <div className={`h-1.5 rounded-full ${w.status === 'rejected' && i >= (w.current_step || 1) ? 'bg-rose-500/30' :
                            i < (w.current_step || 1) ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                          }`} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail / history panel */}
          <div className="lg:sticky lg:top-20">
            {selected ? (
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="chip bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">{selected.request_type}</span>
                  <span className="text-[11px] text-slate-500 mono">#{selected.reference_no}</span>
                </div>
                <div className="heading-display text-xl text-[var(--text-primary)]">{selected.title}</div>
                <div className="text-[13px] text-[var(--text-secondary)] mt-1 leading-relaxed">{selected.description}</div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-inset)]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Requester</div>
                    <div className="font-bold mt-0.5">{selected.requester_name}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-inset)]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Submitted</div>
                    <div className="font-bold mt-0.5">{timeAgo(selected.created_at)}</div>
                  </div>
                </div>

                {/* History timeline */}
                <div className="mt-5">
                  <div className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5"><History size={12} /> Approval history</div>
                  <div className="mt-3 space-y-2.5">
                    {(history[selected.id] || []).map((a, i, arr) => {
                      const color =
                        a.action === 'approved' ? 'from-emerald-500 to-teal-600' :
                          a.action === 'rejected' ? 'from-rose-500 to-pink-600' :
                            a.action === 'comment' ? 'from-slate-500 to-slate-600' :
                              'from-cyan-500 to-blue-600';
                      const Icon =
                        a.action === 'approved' ? CheckCircle2 :
                          a.action === 'rejected' ? XCircle :
                            a.action === 'comment' ? MessageSquare :
                              Send;
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={a.id} className="flex gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-sm`}><Icon size={13} /></div>
                            {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1" />}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="text-[12.5px] font-bold capitalize text-[var(--text-primary)]">{a.action}</div>
                              <div className="text-[10.5px] text-slate-500 mono">{timeAgo(a.created_at)}</div>
                            </div>
                            <div className="text-[11.5px] text-slate-500">by {a.actor} <span className="opacity-70">({a.actor_role})</span></div>
                            {a.reason && <div className="text-[12.5px] text-[var(--text-secondary)] mt-1 p-2 rounded-lg bg-[var(--bg-inset)]">{a.reason}</div>}
                          </div>
                        </div>
                      );
                    })}
                    {(history[selected.id] || []).length === 0 && (
                      <div className="text-[12px] text-slate-500 italic">No history yet.</div>
                    )}
                  </div>
                </div>

                {canApprove && selected.status === 'pending' && (
                  <div className="mt-5 flex gap-2">
                    <button disabled={saving} onClick={() => approve(selected)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 flex-1 justify-center disabled:opacity-60"><CheckCircle2 size={12} /> Approve</button>
                    <button disabled={saving} onClick={() => openReject(selected)} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 flex-1 justify-center disabled:opacity-60"><XCircle size={12} /> Reject with reason</button>
                  </div>
                )}

                {selected.status === 'rejected' && isStudent && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[12.5px] text-rose-700 dark:text-rose-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle size={12} /> Why this was rejected</div>
                    <div>{latestReject(selected)?.reason || '—'}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 flex items-center justify-center mb-3"><ShieldCheck size={22} /></div>
                <div className="text-sm font-bold">Select a request</div>
                <div className="text-xs text-slate-500 mt-1">Click any row to view its approval history.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <>
          <div className="modal-backdrop" onClick={() => !saving && setRejectTarget(null)} />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-lg glass-strong rounded-2xl overflow-hidden scale-in">
              <div className="p-5 border-b border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md"><XCircle size={18} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[var(--text-primary)]">Reject request</div>
                  <div className="text-[11.5px] text-slate-500 mono">#{rejectTarget.reference_no} · {rejectTarget.title}</div>
                </div>
              </div>
              <div className="p-5">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Reason <span className="text-rose-500">*</span></span>
                  <textarea
                    autoFocus
                    rows={5}
                    value={rejectReason}
                    onChange={e => { setRejectReason(e.target.value); setRejectErr(''); }}
                    placeholder="Explain why this request is being rejected. The requester will see this exact message in their Approvals page and history."
                    className="w-full mt-1.5 resize-y"
                  />
                </label>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{rejectReason.trim().length} / 500</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck size={10} className="text-cyan-500" /> Saved to history & sent to requester</span>
                </div>
                {rejectErr && <div className="mt-2 text-[12px] text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-500/20">{rejectErr}</div>}
              </div>
              <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end gap-2 bg-[var(--bg-inset)]">
                <button disabled={saving} onClick={() => setRejectTarget(null)} className="btn-ghost">Cancel</button>
                <button disabled={saving} onClick={confirmReject} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
                  {saving ? 'Rejecting…' : <><XCircle size={14} /> Confirm rejection</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
