import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import { api } from '../../lib/api';
import { Users, Search, Plus, Download, Mail, Phone } from 'lucide-react';

export default function Students() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [program, setProgram] = useState('all');

  const load = async () => { try { setList(await api('/api/students')); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const filtered = list.filter(s =>
    (program === 'all' || s.program === program) &&
    (q === '' || s.full_name?.toLowerCase().includes(q.toLowerCase()) || s.email?.toLowerCase().includes(q.toLowerCase()) || s.student_id?.toLowerCase().includes(q.toLowerCase()))
  );

  const programs = Array.from(new Set(list.map(s => s.program).filter(Boolean)));

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Students" subtitle="Institution-wide student directory" icon={<Users size={22} />}
        actions={<>
          <button className="btn-ghost inline-flex items-center gap-2"><Download size={14} /> Export</button>
          <button className="btn-primary inline-flex items-center gap-2"><Plus size={14} /> Add student</button>
        </>} />

      {/* Quick stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-5 stagger">
        {[
          { l: 'Total', v: list.length, c: 'from-cyan-500 to-teal-500' },
          { l: 'Active', v: list.filter(s => s.status === 'active').length, c: 'from-emerald-500 to-teal-600' },
          { l: 'Programs', v: programs.length, c: 'from-blue-500 to-indigo-600' },
          { l: 'Avg CGPA', v: list.length ? (list.reduce((a, b) => a + Number(b.cgpa || 0), 0) / list.length).toFixed(2) : '—', c: 'from-violet-500 to-purple-600' },
        ].map(s => (
          <div key={s.l} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${s.c} relative overflow-hidden elev-2`}>
            <div className="absolute inset-0 bg-grid opacity-15" />
            <div className="relative">
              <div className="text-[10.5px] uppercase tracking-widest font-bold opacity-85">{s.l}</div>
              <div className="heading-display text-3xl mt-2">{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-solid rounded-2xl p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, student ID…" className="!pl-9 w-full" />
        </div>
        <select value={program} onChange={e => setProgram(e.target.value)} className="md:w-56">
          <option value="all">All programs</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-5 py-3.5">Student</th>
                  <th className="text-left px-5 py-3.5">Program</th>
                  <th className="text-left px-5 py-3.5">Semester</th>
                  <th className="text-left px-5 py-3.5">Contact</th>
                  <th className="text-left px-5 py-3.5">CGPA</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800/60 hover:bg-cyan-50/40 dark:hover:bg-cyan-500/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                          {s.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-bold">{s.full_name}</div>
                          <div className="text-[11px] text-slate-500 mono">{s.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{s.program}</td>
                    <td className="px-5 py-3"><span className="chip bg-blue-500/10 text-blue-600 border border-blue-500/20">Sem {s.semester}</span></td>
                    <td className="px-5 py-3">
                      <div className="text-[11.5px] text-slate-500 flex items-center gap-1"><Mail size={10} />{s.email}</div>
                      <div className="text-[11.5px] text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{s.phone}</div>
                    </td>
                    <td className="px-5 py-3 font-bold text-cyan-600">{s.cgpa?.toFixed(2)}</td>
                    <td className="px-5 py-3"><span className={`chip ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
            <span>{filtered.length} of {list.length} students</span>
            <span>Updated {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
