import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import { api } from '../../lib/api';
import { Briefcase, Plus, Download, Mail, Phone, GraduationCap } from 'lucide-react';

export default function Faculty() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/faculty')); } finally { setLoading(false); } })(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Faculty & HR" subtitle="Teaching staff, contracts, and assignments" icon={<Briefcase size={20} />}
        actions={<>
          <button className="btn-ghost inline-flex items-center gap-2"><Download size={14} /> Export</button>
          <button className="btn-primary inline-flex items-center gap-2"><Plus size={14} /> Add faculty</button>
        </>} />

      {loading ? <Loader /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(f => (
            <div key={f.id} className="surface-solid rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center">
                  {f.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{f.full_name}</div>
                  <div className="text-xs text-slate-500">{f.designation}</div>
                  <div className="chip bg-blue-500/10 text-blue-600 mt-1">{f.department}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><Mail size={11} />{f.email}</div>
                <div className="flex items-center gap-1.5"><Phone size={11} />{f.phone}</div>
                <div className="flex items-center gap-1.5"><GraduationCap size={11} />{f.qualification}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Courses</div><div className="font-bold">{f.courses_count || 3}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Students</div><div className="font-bold">{f.students_count || 120}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</div><div className="font-bold text-amber-500">{f.rating?.toFixed(1) || '4.7'}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
