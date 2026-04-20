import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { GraduationCap, CheckCircle2, XCircle, Eye } from 'lucide-react';
import Loader from '../../components/Loader';

export default function AdmissionsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'shortlisted'>('all');

  const load = async () => { try { setList(await api('/api/admissions')); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const update = async (id: number, status: string) => {
    await api('/api/admissions', { method: 'PUT', body: JSON.stringify({ id, status }) });
    load();
  };

  const filtered = filter === 'all' ? list : list.filter(a => a.status === filter);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Admissions" subtitle="Review and approve applicant submissions" icon={<GraduationCap size={20} />} />

      <div className="grid sm:grid-cols-5 gap-3 mb-4">
        {[
          { l: 'Total', v: list.length, c: 'bg-slate-500' },
          { l: 'Pending', v: list.filter(a => a.status === 'pending').length, c: 'bg-amber-500' },
          { l: 'Shortlisted', v: list.filter(a => a.status === 'shortlisted').length, c: 'bg-blue-500' },
          { l: 'Approved', v: list.filter(a => a.status === 'approved').length, c: 'bg-emerald-500' },
          { l: 'Rejected', v: list.filter(a => a.status === 'rejected').length, c: 'bg-rose-500' },
        ].map(s => (
          <div key={s.l} className="surface-solid rounded-xl p-4 flex items-center gap-3">
            <div className={`w-2 h-10 rounded-full ${s.c}`} />
            <div><div className="text-xs text-slate-500">{s.l}</div><div className="text-2xl font-extrabold">{s.v}</div></div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'pending', 'shortlisted', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap capitalize ${filter === f ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white' : 'surface-solid'}`}>{f}</button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr><th className="text-left px-4 py-3">Applicant</th><th className="text-left px-4 py-3">Program</th><th className="text-left px-4 py-3">Score</th><th className="text-left px-4 py-3">Submitted</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold">{a.full_name}</div>
                      <div className="text-[11px] text-slate-500">{a.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{a.program}</td>
                    <td className="px-4 py-2.5 font-bold text-teal-600">{a.score}%</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{a.submitted_at?.slice(0, 10)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`chip ${a.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : a.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : a.status === 'shortlisted' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        {a.status === 'pending' && <>
                          <button onClick={() => update(a.id, 'shortlisted')} className="btn-ghost !py-1 !px-2 text-xs">Shortlist</button>
                        </>}
                        {(a.status === 'pending' || a.status === 'shortlisted') && <>
                          <button onClick={() => update(a.id, 'approved')} className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1"><CheckCircle2 size={11} /></button>
                          <button onClick={() => update(a.id, 'rejected')} className="bg-rose-500 text-white px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1"><XCircle size={11} /></button>
                        </>}
                      </div>
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
