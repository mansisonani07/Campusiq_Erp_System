import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { File as FileIcon, FolderOpen, Upload, Download, Search, ShieldCheck } from 'lucide-react';
import Loader from '../../components/Loader';
import Tilt from '../../components/Tilt';
import { downloadDocument } from '../../lib/downloader';
import { useSession } from '../../lib/session';
import { can } from '../../lib/rbac';

export default function Documents() {
  const { user } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await api<any[]>('/api/documents');
        const scoped = (user && user.role !== 'admin' && user.studentId)
          ? raw.filter(d => !d.owner || d.owner === user.studentId)
          : raw;
        setList(scoped);
      } finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = list.filter(d => q === '' || d.title?.toLowerCase().includes(q.toLowerCase()) || d.category?.toLowerCase().includes(q.toLowerCase()));
  const categories = Array.from(new Set(list.map(d => d.category))).filter(Boolean);

  const onDownload = (d: any) => {
    downloadDocument({ title: d.title, category: d.category, ownerName: user?.name || 'Student' });
  };

  const scopeChip = useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin') return { label: 'All records', tone: 'from-rose-500 to-orange-500' };
    if (user.role === 'parent') return { label: `Ward · ${user.studentId}`, tone: 'from-violet-500 to-purple-600' };
    return { label: `Owner · ${user.studentId || 'you'}`, tone: 'from-cyan-500 to-teal-500' };
  }, [user]);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Documents" subtitle="Certificates, forms and academic records" icon={<FolderOpen size={22} />}
        actions={<>
          {scopeChip && (
            <div className={`chip bg-gradient-to-r ${scopeChip.tone} text-white border-0 inline-flex`}>
              <ShieldCheck size={10} /> {scopeChip.label}
            </div>
          )}
          {user && can(user.role, 'documents', 'create') && (
            <button className="btn-primary inline-flex items-center gap-2"><Upload size={14} /> Upload</button>
          )}
        </>} />

      <div className="surface-solid rounded-2xl p-4 mb-4 relative">
        <Search size={15} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search documents…" className="!pl-9 w-full" />
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-4 stagger">
        {categories.slice(0, 4).map(c => (
          <Tilt key={c} max={10} scale={1.02} className="rounded-xl">
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 card-gradient-border h-full">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md"><FolderOpen size={18} /></div>
              <div><div className="font-bold text-sm capitalize">{c}</div><div className="text-[11px] text-[var(--text-tertiary)]">{list.filter(d => d.category === c).length} files</div></div>
            </div>
          </Tilt>
        ))}
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="text-left px-5 py-3.5">Name</th>
                <th className="text-left px-5 py-3.5">Category</th>
                <th className="text-left px-5 py-3.5">Size</th>
                <th className="text-left px-5 py-3.5">Uploaded</th>
                <th className="text-right px-5 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-t border-[var(--border-subtle)] hover:bg-cyan-50/40 dark:hover:bg-cyan-500/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${d.file_type === 'pdf' ? 'from-rose-500 to-pink-600' : d.file_type === 'doc' ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'} shadow-md`}><FileIcon size={14} /></div>
                      <div><div className="font-bold">{d.title}</div><div className="text-[11px] text-[var(--text-tertiary)] uppercase">{d.file_type}</div></div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="chip bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 capitalize">{d.category}</span></td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)] text-xs">{d.size_kb ? (d.size_kb > 1024 ? (d.size_kb / 1024).toFixed(1) + ' MB' : d.size_kb + ' KB') : ''}</td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)] mono text-xs">{d.uploaded_at?.slice(0, 10)}</td>
                  <td className="px-5 py-3 text-right">
                    {user && can(user.role, 'documents', 'download') ? (
                      <button onClick={() => onDownload(d)} className="btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1">
                        <Download size={11} /> Download
                      </button>
                    ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
