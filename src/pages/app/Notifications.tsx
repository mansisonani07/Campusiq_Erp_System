import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { Bell, BellRing, AlertTriangle, CheckCircle2, Info, MailPlus, Send } from 'lucide-react';
import Loader from '../../components/Loader';
import { useSession } from '../../lib/session';

export default function Notifications() {
  const { user } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', priority: 'medium', channel: 'in_app' });

  const load = async () => {
    try {
      const raw = await api<any[]>('/api/notifications');
      const scoped = user && user.role !== 'admin'
        ? raw.filter(n => n.audience === 'all' || n.audience === (user.role === 'student' ? 'students' : user.role === 'faculty' ? 'faculty' : user.role === 'parent' ? 'parents' : 'all'))
        : raw;
      setList(scoped);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);

  const markRead = async (id: number) => { await api('/api/notifications', { method: 'PUT', body: JSON.stringify({ id, is_read: true }) }); load(); };
  const send = async () => {
    await api('/api/notifications', { method: 'POST', body: JSON.stringify({ ...form, is_read: false, created_at: new Date().toISOString() }) });
    setComposing(false); setForm({ title: '', body: '', audience: 'all', priority: 'medium', channel: 'in_app' }); load();
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Notifications" subtitle="Alerts across email, SMS, push & in-app" icon={<Bell size={20} />}
        actions={(user?.role === 'faculty' || user?.role === 'admin') && <button onClick={() => setComposing(v => !v)} className="btn-primary inline-flex items-center gap-2"><MailPlus size={14} /> Broadcast</button>} />

      {composing && (
        <div className="surface-solid rounded-2xl p-5 mb-4 grid md:grid-cols-2 gap-3">
          <label className="block md:col-span-2"><span className="text-xs font-semibold">Title</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full mt-1" /></label>
          <label className="block md:col-span-2"><span className="text-xs font-semibold">Body</span><textarea rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full mt-1" /></label>
          <label className="block"><span className="text-xs font-semibold">Audience</span><select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full mt-1"><option value="all">Everyone</option><option value="students">Students</option><option value="faculty">Faculty</option><option value="parents">Parents</option></select></label>
          <label className="block"><span className="text-xs font-semibold">Priority</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full mt-1"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <div className="md:col-span-2 flex justify-end gap-2"><button onClick={() => setComposing(false)} className="btn-ghost">Cancel</button><button onClick={send} className="btn-primary inline-flex items-center gap-2"><Send size={14} /> Send broadcast</button></div>
        </div>
      )}

      {loading ? <Loader /> : (
        <div className="space-y-2">
          {list.map(n => (
            <div key={n.id} className={`surface-solid rounded-xl p-4 flex items-start gap-3 ${!n.is_read ? 'border-l-4 border-l-teal-500' : ''}`}>
              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.priority === 'high' ? 'bg-rose-500/15 text-rose-600' : n.priority === 'medium' ? 'bg-amber-500/15 text-amber-600' : 'bg-teal-500/15 text-teal-600'}`}>
                {n.priority === 'high' ? <AlertTriangle size={18} /> : n.priority === 'medium' ? <BellRing size={18} /> : <Info size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold">{n.title}</div>
                  <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600">{n.channel}</span>
                  {!n.is_read && <span className="chip bg-teal-500/10 text-teal-600">New</span>}
                </div>
                <div className="text-sm text-slate-500 mt-1">{n.body}</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">{new Date(n.created_at).toLocaleString()} · {n.audience}</div>
              </div>
              {!n.is_read && <button onClick={() => markRead(n.id)} className="btn-ghost !py-1 !px-2 text-xs inline-flex items-center gap-1"><CheckCircle2 size={11} /> Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
