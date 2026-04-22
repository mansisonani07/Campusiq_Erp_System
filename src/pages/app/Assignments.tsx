import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { FileText, Upload, CheckCircle2, Clock, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react';
import Loader from '../../components/Loader';
import { useSession } from '../../lib/session';

export default function Assignments() {
  const { user } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  const load = async () => {
    try {
      const raw = await api<any[]>('/api/assignments');
      const scoped = (user && (user.role === 'student' || user.role === 'parent') && user.studentId)
        ? raw.filter(r => !r.student_id || r.student_id === user.studentId)
        : raw;
      setList(scoped);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);

  const submit = async (id: number) => {
    await api('/api/assignments', { method: 'PUT', body: JSON.stringify({ id, status: 'submitted', submitted_on: new Date().toISOString().slice(0, 10) }) });
    load();
  };

  const filtered = filter === 'all' ? list : list.filter(a => a.status === filter);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Assignments" subtitle="Track submissions, deadlines and grading" icon={<FileText size={20} />}
        actions={user && (user.role === 'student' || user.role === 'parent') ? <div className="chip bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0 inline-flex"><ShieldCheck size={10} /> Scoped to {user.studentId}</div> : undefined} />

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {([['all', 'All'], ['pending', 'Pending'], ['submitted', 'Submitted'], ['overdue', 'Overdue']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${filter === v ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white' : 'surface-solid'}`}>{l}</button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const daysLeft = Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000);
            const urgent = daysLeft <= 2 && a.status === 'pending';
            return (
              <div key={a.id} className={`surface-solid rounded-2xl p-5 relative overflow-hidden ${urgent ? 'ring-2 ring-amber-400/50' : ''}`}>
                {urgent && <div className="absolute top-2 right-2 chip bg-amber-500/20 text-amber-700"><AlertTriangle size={10} /> Urgent</div>}
                <div className="chip bg-blue-500/10 text-blue-600">{a.course_code}</div>
                <div className="mt-2 font-bold text-[15px]">{a.title}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</div>
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                  <Calendar size={12} /> Due {new Date(a.due_date).toLocaleDateString()} · <span className={daysLeft < 0 ? 'text-rose-600 font-semibold' : daysLeft <= 2 ? 'text-amber-600 font-semibold' : ''}>{daysLeft >= 0 ? `${daysLeft}d left` : `${-daysLeft}d overdue`}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className={`chip ${a.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-600' : a.status === 'overdue' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    {a.status === 'submitted' ? <CheckCircle2 size={10} /> : <Clock size={10} />} {a.status}
                  </span>
                  <span className="text-xs text-slate-500">Max {a.max_marks || 100}</span>
                </div>
                {a.status !== 'submitted' && (
                  <button onClick={() => submit(a.id)} className="btn-primary w-full mt-3 !py-2 text-xs inline-flex items-center justify-center gap-2"><Upload size={12} /> Submit</button>
                )}
                {a.status === 'submitted' && a.marks && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-center font-bold">Scored {a.marks}/{a.max_marks}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
