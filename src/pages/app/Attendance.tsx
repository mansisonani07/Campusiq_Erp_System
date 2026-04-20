import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { ClipboardList, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import { Donut, LineChart } from '../../components/Charts';
import Loader from '../../components/Loader';

export default function Attendance() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/attendance')); } finally { setLoading(false); } })(); }, []);

  const total = list.length;
  const present = list.filter(r => r.status === 'present').length;
  const absent = list.filter(r => r.status === 'absent').length;
  const late = list.filter(r => r.status === 'late').length;

  // Build weekly trend
  const byDate = new Map<string, { p: number; a: number }>();
  list.forEach(r => { const d = r.session_date; const cur = byDate.get(d) || { p: 0, a: 0 }; cur[r.status === 'present' || r.status === 'late' ? 'p' : 'a']++; byDate.set(d, cur); });
  const dates = Array.from(byDate.keys()).sort().slice(-10);
  const trend = dates.map(d => { const c = byDate.get(d)!; return Math.round((c.p / Math.max(c.p + c.a, 1)) * 100); });

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Attendance" subtitle="Session-wise attendance tracking & analytics" icon={<ClipboardList size={20} />} />
      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <div className="surface-solid rounded-2xl p-5 flex items-center gap-4 lg:col-span-2">
          <Donut value={present} total={total || 1} label="Present" sub={`${present} / ${total} sessions`} />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10"><div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /><span className="text-sm font-semibold">Present</span></div><span className="font-bold">{present}</span></div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10"><div className="flex items-center gap-2"><CalendarDays size={14} className="text-amber-600" /><span className="text-sm font-semibold">Late</span></div><span className="font-bold">{late}</span></div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10"><div className="flex items-center gap-2"><XCircle size={14} className="text-rose-600" /><span className="text-sm font-semibold">Absent</span></div><span className="font-bold">{absent}</span></div>
          </div>
        </div>
        <div className="surface-solid rounded-2xl p-5 lg:col-span-2">
          <div className="text-sm font-bold mb-1">Trend · last {trend.length} sessions</div>
          <div className="text-xs text-slate-500 mb-2">% present per session</div>
          <div className="text-slate-700 dark:text-slate-300">
            <LineChart data={trend.length ? trend : [92, 88, 95, 90, 87, 94, 96]} height={170} />
          </div>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-sm font-bold">Recent sessions</div>
            <div className="chip bg-teal-500/10 text-teal-600">{list.length} records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Course</th>
                  <th className="text-left px-4 py-3">Session</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 40).map(r => (
                  <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-2.5 font-mono text-xs">{r.session_date}</td>
                    <td className="px-4 py-2.5 font-semibold">{r.course_code}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.session_title}</td>
                    <td className="px-4 py-2.5"><span className="chip bg-slate-200 dark:bg-slate-800 text-slate-700">{r.method}</span></td>
                    <td className="px-4 py-2.5">
                      <span className={`chip ${r.status === 'present' ? 'bg-emerald-500/10 text-emerald-600' : r.status === 'absent' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
