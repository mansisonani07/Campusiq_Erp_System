import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { Building2, BedDouble, User, Phone, Utensils } from 'lucide-react';
import Loader from '../../components/Loader';

export default function Hostel() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/hostel')); } finally { setLoading(false); } })(); }, []);

  const blocks = Array.from(new Set(list.map(h => h.block))).sort();

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Hostel" subtitle="Block, room, warden, and mess management" icon={<Building2 size={20} />} />

      <div className="grid sm:grid-cols-4 gap-4 mb-4">
        {[
          { l: 'Blocks', v: blocks.length, c: 'from-teal-500 to-cyan-500' },
          { l: 'Rooms', v: list.length, c: 'from-blue-500 to-indigo-600' },
          { l: 'Occupied', v: list.filter(l => l.status === 'occupied').length, c: 'from-emerald-500 to-teal-600' },
          { l: 'Vacant', v: list.filter(l => l.status === 'vacant').length, c: 'from-amber-500 to-orange-500' },
        ].map(s => (
          <div key={s.l} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${s.c}`}>
            <div className="text-xs uppercase tracking-wider opacity-80">{s.l}</div>
            <div className="text-3xl font-extrabold mt-2">{s.v}</div>
          </div>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="space-y-5">
          {blocks.map(block => (
            <div key={block} className="surface-solid rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 text-white flex items-center justify-center"><Building2 size={16} /></div><div><div className="font-bold">Block {block}</div><div className="text-xs text-slate-500">{list.filter(l => l.block === block).length} rooms</div></div></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {list.filter(l => l.block === block).map(r => (
                  <div key={r.id} className={`p-3 rounded-xl border ${r.status === 'occupied' ? 'bg-teal-500/5 border-teal-500/30' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 border-dashed'}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs">{r.block}-{r.room_no}</div>
                      <BedDouble size={12} className="text-slate-400" />
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-1 truncate">{r.occupant_name || 'Vacant'}</div>
                    <div className="text-[10px] text-slate-500 truncate">{r.room_type} · ₹{r.monthly_fee}/mo</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="surface-solid rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Utensils size={15} className="text-amber-500" /><div className="text-sm font-bold">This week’s mess menu</div></div>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <div key={d} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                <div className="font-bold text-slate-700 dark:text-slate-300">{d}</div>
                <div className="text-slate-500 mt-1 text-[10px]">{['Idli', 'Poha', 'Paratha', 'Dosa', 'Upma', 'Puri', 'Chola'][i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface-solid rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><User size={15} className="text-teal-500" /><div className="text-sm font-bold">Warden contacts</div></div>
          <div className="space-y-2">
            {[{ b: 'A', n: 'Rekha Iyer', p: '+91 98765 41201' }, { b: 'B', n: 'Sanjay Verma', p: '+91 98765 41202' }, { b: 'C', n: 'Meera Nath', p: '+91 98765 41203' }].map(w => (
              <div key={w.b} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                <div><div className="font-semibold text-sm">Block {w.b} — {w.n}</div><div className="text-[11px] text-slate-500 flex items-center gap-1"><Phone size={10} />{w.p}</div></div>
                <button className="btn-ghost !py-1 !px-2 text-[11px]">Message</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
