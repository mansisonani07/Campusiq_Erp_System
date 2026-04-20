import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { Bus, MapPin, Clock, User, Phone } from 'lucide-react';
import Loader from '../../components/Loader';

export default function Transport() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/transport')); } finally { setLoading(false); } })(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Transport" subtitle="Routes, stops, drivers and tracking" icon={<Bus size={20} />} />

      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map(r => (
            <div key={r.id} className="surface-solid rounded-2xl overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-teal-500 to-blue-600 relative flex items-center px-5">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="relative z-10 text-white">
                  <div className="chip bg-white/20 border border-white/30">Route {r.route_no}</div>
                  <div className="font-extrabold text-xl mt-1">{r.route_name}</div>
                </div>
                <div className="ml-auto w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-white relative z-10"><Bus size={28} /></div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Vehicle</div>
                    <div className="font-bold font-mono">{r.vehicle_no}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Capacity</div>
                    <div className="font-bold">{r.capacity} seats</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Driver</div>
                    <div className="font-semibold text-sm flex items-center gap-1"><User size={11} />{r.driver_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Contact</div>
                    <div className="font-semibold text-sm flex items-center gap-1"><Phone size={11} />{r.driver_phone}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1"><MapPin size={11} /> Stops</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(r.stops || '').split(',').filter(Boolean).map((s: string, i: number) => (
                      <span key={i} className="chip bg-teal-500/10 text-teal-700">{s.trim()}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" /><span className="text-xs font-semibold text-emerald-600">Live · on time</span></div>
                  <div className="text-xs text-slate-500"><Clock size={11} className="inline" /> Next pickup {r.next_pickup || '7:15 AM'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
