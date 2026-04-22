import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import { api } from '../../lib/api';
import { BookOpen, Users, Clock, Award } from 'lucide-react';
import { ProgressBar } from '../../components/Charts';

export default function Courses() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/courses')); } finally { setLoading(false); } })(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Courses" subtitle="Academic catalog and enrollments" icon={<BookOpen size={20} />} />
      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(c => {
            const pct = Math.round(((c.sessions_done || 18) / (c.total_sessions || 40)) * 100);
            return (
              <div key={c.id} className="surface-solid rounded-2xl p-5 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-start justify-between">
                  <div className="chip bg-teal-500/10 text-teal-700">{c.code}</div>
                  <div className="chip bg-blue-500/10 text-blue-700">{c.credits} credits</div>
                </div>
                <div className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">{c.title}</div>
                <div className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                  <Users size={11} />{c.faculty_name}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1"><span>Progress</span><span className="font-bold text-teal-600">{pct}%</span></div>
                  <ProgressBar value={pct} />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">
                  <div><div className="font-bold text-slate-900 dark:text-white text-sm">{c.enrolled || 42}</div>Students</div>
                  <div><div className="font-bold text-slate-900 dark:text-white text-sm">{c.total_sessions || 40}</div>Sessions</div>
                  <div><div className="font-bold text-slate-900 dark:text-white text-sm">{c.semester}</div>Semester</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
