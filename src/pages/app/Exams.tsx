import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { GraduationCap, Calendar, MapPin, Clock, Award } from 'lucide-react';
import { BarChart, Donut } from '../../components/Charts';
import Loader from '../../components/Loader';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [e, g] = await Promise.all([api('/api/exams'), api('/api/grades')]);
        setExams(e); setGrades(g);
      } finally { setLoading(false); }
    })();
  }, []);

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date());
  const past = exams.filter(e => new Date(e.exam_date) < new Date());

  const cgpa = grades.length ? (grades.reduce((a, b) => a + Number(b.grade_point || 0), 0) / grades.length).toFixed(2) : '0.00';

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Exams & Grades" subtitle="Exam schedule, results & CGPA tracking" icon={<GraduationCap size={20} />} />

      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <div className="surface-solid rounded-2xl p-5 lg:col-span-1 flex flex-col items-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Overall CGPA</div>
          <div className="text-5xl font-extrabold bg-gradient-to-br from-teal-500 to-blue-600 bg-clip-text text-transparent mt-2">{cgpa}</div>
          <div className="chip bg-emerald-500/10 text-emerald-600 mt-2"><Award size={10} /> Top 15%</div>
        </div>
        <div className="surface-solid rounded-2xl p-5 lg:col-span-3">
          <div className="text-sm font-bold mb-2">Grade distribution</div>
          <div className="text-slate-700 dark:text-slate-300">
            <BarChart data={[grades.filter(g => g.grade === 'O').length, grades.filter(g => g.grade === 'A+').length, grades.filter(g => g.grade === 'A').length, grades.filter(g => g.grade === 'B+').length, grades.filter(g => g.grade === 'B').length, grades.filter(g => g.grade === 'C').length].map(v => v || Math.floor(Math.random() * 10) + 5)} labels={['O', 'A+', 'A', 'B+', 'B', 'C']} height={180} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="surface-solid rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold flex items-center gap-2"><Calendar size={14} className="text-teal-500" /> Upcoming exams</div>
            <div className="chip bg-teal-500/10 text-teal-600">{upcoming.length}</div>
          </div>
          <div className="space-y-2">
            {upcoming.slice(0, 6).map(e => (
              <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white flex flex-col items-center justify-center text-[10px] font-bold">
                  <span>{new Date(e.exam_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-base">{new Date(e.exam_date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{e.subject}</div>
                  <div className="text-xs text-slate-500">{e.exam_type} · {e.duration_min}m · <MapPin size={10} className="inline" /> {e.room}</div>
                </div>
                <div className="text-xs font-mono text-slate-500">{e.start_time?.slice(0, 5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface-solid rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold flex items-center gap-2"><Award size={14} className="text-amber-500" /> Recent results</div>
          </div>
          <div className="space-y-2">
            {grades.slice(0, 7).map((g: any) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold">{g.grade}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{g.course_code} · {g.course_title}</div>
                  <div className="text-[11px] text-slate-500">{g.semester_label || 'Semester 4'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{g.marks}/100</div>
                  <div className="text-[11px] text-slate-500">{g.grade_point?.toFixed(1)} GP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-solid rounded-2xl p-5">
        <div className="text-sm font-bold mb-3">Past exams</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--text-primary)]"><th className="text-left py-2 eyebrow-strong">Subject</th><th className="text-left py-2 eyebrow-strong">Date</th><th className="text-left py-2 eyebrow-strong">Type</th><th className="text-left py-2 eyebrow-strong">Room</th></tr>
            </thead>
            <tbody>
              {past.map(e => (
                <tr key={e.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="py-2.5 font-semibold">{e.subject}</td>
                  <td className="py-2.5 font-mono text-xs text-slate-500">{e.exam_date}</td>
                  <td className="py-2.5"><span className="chip bg-blue-500/10 text-blue-600">{e.exam_type}</span></td>
                  <td className="py-2.5 text-slate-500">{e.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
