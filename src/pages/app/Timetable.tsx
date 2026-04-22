import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Loader from '../../components/Loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['09:00', '10:15', '11:30', '13:15', '14:30', '15:45'];

export default function Timetable() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/timetable')); } finally { setLoading(false); } })(); }, []);

  const getSlot = (dayIdx: number, time: string) => list.find(t => t.day_index === dayIdx && t.start_time?.startsWith(time.slice(0, 2)));

  const palette = ['from-cyan-500 to-teal-500', 'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-600'];

  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Timetable" subtitle="Weekly class schedule across all departments" icon={<Calendar size={22} />} />

      <div className="grid sm:grid-cols-3 gap-4 mb-5 stagger">
        {[
          { l: 'Weekly lectures', v: list.length || '—', c: 'from-cyan-500 to-teal-500' },
          { l: 'Unique subjects', v: new Set(list.map(l => l.subject)).size || '—', c: 'from-blue-500 to-indigo-600' },
          { l: 'Faculty involved', v: new Set(list.map(l => l.faculty)).size || '—', c: 'from-violet-500 to-purple-600' }
        ].map(s => (
          <div key={s.l} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${s.c} relative overflow-hidden elev-2`}>
            <div className="absolute inset-0 bg-grid opacity-15" />
            <div className="relative">
              <div className="text-[10.5px] uppercase tracking-widest font-bold opacity-85">{s.l}</div>
              <div className="heading-display text-4xl mt-2">{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl p-5 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[70px_repeat(6,1fr)] gap-2.5">
              <div />
              {DAYS.map((d, i) => (
                <div key={d} className={`text-center py-3 rounded-xl font-bold text-[13px] ${i === todayIdx ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'}`}>
                  <div>{SHORT[i]}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${i === todayIdx ? 'text-white/80' : 'text-slate-400'}`}>{d}</div>
                </div>
              ))}
              {TIMES.map((t, ti) => (
                <div key={t} className="contents">
                  <div className="text-[11px] mono text-slate-500 flex items-center justify-end pr-2 font-semibold">{t}</div>
                  {DAYS.map((d, di) => {
                    const slot = getSlot(di, t);
                    if (!slot) return <div key={t + d} className="h-[90px] rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-dashed border-slate-200/70 dark:border-slate-800/60" />;
                    const color = palette[(ti + di) % palette.length];
                    return (
                      <div key={t + d} className={`h-[90px] rounded-xl bg-gradient-to-br ${color} text-white p-3 flex flex-col justify-between shadow-md hover-lift relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-grid opacity-15" />
                        <div className="relative">
                          <div className="text-[9px] opacity-85 mono font-semibold">{slot.course_code}</div>
                          <div className="font-bold text-[13px] leading-tight mt-0.5 line-clamp-2">{slot.subject}</div>
                        </div>
                        <div className="relative text-[10px] opacity-95 flex items-center justify-between">
                          <span className="flex items-center gap-1"><MapPin size={9} />{slot.room}</span>
                          <span className="flex items-center gap-1"><Clock size={9} />{slot.start_time?.slice(0, 5)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
