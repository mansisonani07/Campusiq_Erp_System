import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { MessageSquare, Send, Search } from 'lucide-react';
import Loader from '../../components/Loader';
import { useSession } from '../../lib/session';

export default function Messages() {
  const { user } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const load = async () => {
    try {
      const raw = await api<any[]>('/api/messages');
      const scoped = user && user.role !== 'admin' && user.role !== 'faculty'
        ? raw.filter(m => m.sender === user.email || m.recipient === user.email)
        : raw;
      setList(scoped);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);

  // Group by counterpart
  const groups = new Map<string, any[]>();
  list.forEach(m => {
    const other = m.sender === user?.email ? m.recipient : m.sender;
    if (!groups.has(other)) groups.set(other, []);
    groups.get(other)!.push(m);
  });
  const threads = Array.from(groups.entries()).map(([who, msgs]) => ({ who, msgs, last: msgs[0] }));

  const activeMsgs = active ? groups.get(active) || [] : [];

  const send = async () => {
    if (!input || !active) return;
    await api('/api/messages', { method: 'POST', body: JSON.stringify({ sender: user?.email, recipient: active, body: input, sent_at: new Date().toISOString(), subject: 'Re: conversation' }) });
    setInput(''); load();
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Messages" subtitle="Faculty, peer & parent communication" icon={<MessageSquare size={20} />} />

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl grid lg:grid-cols-3 overflow-hidden h-[600px]">
          <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 relative">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search…" className="!pl-8 !py-1.5 text-sm w-full" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {threads.map(t => (
                <button key={t.who} onClick={() => setActive(t.who)} className={`w-full text-left px-3 py-3 border-b border-slate-100 dark:border-slate-800/60 link-row ${active === t.who ? 'bg-teal-500/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs">{t.who[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{t.who.split('@')[0]}</div>
                      <div className="text-[11px] text-slate-500 truncate">{t.last.body}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col">
            {active ? (<>
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">{active}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/30">
                {activeMsgs.slice().reverse().map((m, i) => {
                  const mine = m.sender === user?.email;
                  return (
                    <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${mine ? 'bg-gradient-to-br from-teal-500 to-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'} max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm`}>
                        <div className="text-sm">{m.body}</div>
                        <div className="text-[10px] mt-1 opacity-70">{new Date(m.sent_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message…" className="flex-1" />
                <button onClick={send} className="btn-primary !px-3"><Send size={16} /></button>
              </div>
            </>) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select a conversation to view messages.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
