import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { Library as LibIcon, Search, BookMarked, Bookmark, Download } from 'lucide-react';
import Loader from '../../components/Loader';
import Tilt from '../../components/Tilt';
import { downloadBookCopy } from '../../lib/downloader';

export default function Library() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  useEffect(() => { (async () => { try { setList(await api('/api/library')); } finally { setLoading(false); } })(); }, []);

  const filtered = list.filter(b => q === '' || b.title?.toLowerCase().includes(q.toLowerCase()) || b.author?.toLowerCase().includes(q.toLowerCase()) || b.isbn?.includes(q));

  const handleAction = async (b: any) => {
    const action: 'borrow' | 'reserve' | 'return' = b.status === 'available' ? 'borrow' : b.status === 'borrowed' ? 'return' : 'reserve';
    // Download a slip PDF for the action
    downloadBookCopy({ title: b.title, author: b.author, isbn: b.isbn, action });
    // Flip the status through the API
    const nextStatus = action === 'borrow' ? 'borrowed' : action === 'return' ? 'available' : 'reserved';
    try {
      await api('/api/library', { method: 'PUT', body: JSON.stringify({ id: b.id, status: nextStatus }) });
      setList(await api('/api/library'));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Library" subtitle="Catalog, reservations, and current loans" icon={<LibIcon size={22} />} />

      <div className="grid sm:grid-cols-4 gap-4 mb-5 stagger">
        {[
          { l: 'Total books', v: list.length, c: 'from-cyan-500 to-teal-500' },
          { l: 'Available', v: list.filter(b => b.status === 'available').length, c: 'from-emerald-500 to-teal-600' },
          { l: 'Borrowed', v: list.filter(b => b.status === 'borrowed').length, c: 'from-amber-500 to-orange-500' },
          { l: 'Reserved', v: list.filter(b => b.status === 'reserved').length, c: 'from-violet-500 to-purple-600' },
        ].map(s => (
          <Tilt key={s.l} max={10} scale={1.02} className="rounded-2xl">
            <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${s.c} relative overflow-hidden elev-2 h-full`}>
              <div className="absolute inset-0 bg-grid opacity-15" />
              <div className="relative">
                <div className="text-[10.5px] uppercase tracking-widest font-bold opacity-85">{s.l}</div>
                <div className="heading-display text-3xl mt-2">{s.v}</div>
              </div>
            </div>
          </Tilt>
        ))}
      </div>

      <div className="surface-solid rounded-2xl p-4 mb-4 relative">
        <Search size={15} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, author, ISBN…" className="!pl-9 w-full" />
      </div>

      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(b => (
            <Tilt key={b.id} max={8} scale={1.015} className="rounded-2xl">
              <div className="glass-card rounded-2xl p-5 flex gap-4 h-full card-gradient-border">
                <div className="w-20 h-28 shrink-0 rounded-lg bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-20" />
                  <BookMarked size={28} className="relative" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-tight">{b.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{b.author}</div>
                  <div className="text-[11px] text-slate-400 mono mt-1">{b.isbn}</div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`chip ${b.status === 'available' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : b.status === 'borrowed' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-violet-500/10 text-violet-600 border border-violet-500/20'}`}>{b.status}</span>
                    <span className="chip bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{b.category}</span>
                  </div>
                  <button onClick={() => handleAction(b)} className="btn-soft !py-1.5 !px-3 mt-3 text-xs inline-flex items-center gap-1">
                    {b.status === 'available' ? <><Bookmark size={11} /> Borrow &amp; download slip</> :
                      b.status === 'borrowed' ? <><Download size={11} /> Return slip</> :
                        <><Download size={11} /> Reservation slip</>}
                  </button>
                </div>
              </div>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  );
}
