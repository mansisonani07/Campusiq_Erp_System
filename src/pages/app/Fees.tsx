import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { CreditCard, Download, Receipt, Calendar, ShieldCheck } from 'lucide-react';
import { Donut } from '../../components/Charts';
import Loader from '../../components/Loader';
import Tilt from '../../components/Tilt';
import { useSession } from '../../lib/session';
import { can } from '../../lib/rbac';
import { downloadReceipt, downloadGeneric } from '../../lib/downloader';

export default function Fees() {
  const { user } = useSession();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await api<any[]>('/api/fees');
        // Data isolation: non-admins only see their own / ward's invoices
        const scoped = (user && user.role !== 'admin' && user.studentId)
          ? raw.filter(r => r.student_id === user.studentId)
          : raw;
        setList(scoped);
      } finally { setLoading(false); }
    })();
  }, [user]);

  const paid = list.filter(f => f.status === 'paid').reduce((a, b) => a + Number(b.amount), 0);
  const due = list.filter(f => f.status !== 'paid').reduce((a, b) => a + Number(b.amount), 0);
  const total = paid + due;

  const canEdit = user ? can(user.role, 'fees', 'edit') : false;

  const pay = async (id: number) => {
    if (!can(user!.role, 'fees', 'edit') && user!.role !== 'student' && user!.role !== 'parent') return;
    await api('/api/fees', { method: 'PUT', body: JSON.stringify({ id, status: 'paid', paid_on: new Date().toISOString().slice(0, 10) }) });
    const raw = await api<any[]>('/api/fees');
    setList((user && user.role !== 'admin' && user.studentId) ? raw.filter(r => r.student_id === user.studentId) : raw);
  };

  const handleReceipt = (f: any) => {
    downloadReceipt({
      studentName: user?.name || 'Student',
      invoiceNo: f.invoice_no,
      description: f.description,
      amount: Number(f.amount),
      paidOn: f.paid_on,
      status: f.status,
    });
  };

  const handleBulkExport = () => {
    const lines = list.map(f => `${f.invoice_no}  -  ${f.description}  -  Rs ${Number(f.amount).toLocaleString()}  -  ${f.status}`);
    downloadGeneric(`${(user?.name || 'Student').replace(/\s/g, '_')}_Fee_Statement`, 'CampusIQ · Fee Statement', [
      `Generated: ${new Date().toLocaleString()}`,
      `Scope: ${user?.role === 'admin' ? 'Institution-wide' : 'Student-scoped (RBAC enforced)'}`,
      '',
      ...lines,
      '',
      `Total billed: Rs ${total.toLocaleString()}`,
      `Total paid: Rs ${paid.toLocaleString()}`,
      `Outstanding: Rs ${due.toLocaleString()}`,
    ]);
  };

  const scopeChip = useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin') return { label: 'Institution-wide', tone: 'from-rose-500 to-orange-500' };
    if (user.role === 'parent') return { label: `Ward · ${user.studentId}`, tone: 'from-violet-500 to-purple-600' };
    return { label: `Student · ${user.studentId}`, tone: 'from-cyan-500 to-teal-500' };
  }, [user]);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Fees"
        subtitle="Payments, receipts & upcoming dues"
        icon={<CreditCard size={22} />}
        actions={
          <>
            {scopeChip && (
              <div className={`chip bg-gradient-to-r ${scopeChip.tone} text-white border-0 inline-flex`}>
                <ShieldCheck size={10} /> {scopeChip.label}
              </div>
            )}
            <button onClick={handleBulkExport} className="btn-ghost inline-flex items-center gap-2"><Download size={14} /> Download statement</button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-5 stagger">
        <Tilt max={10} scale={1.02} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-5 card-gradient-border h-full">
            <div className="text-[10.5px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">Total billed</div>
            <div className="heading-display text-3xl mt-2">₹{total.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">Across {list.length} invoices</div>
          </div>
        </Tilt>
        <Tilt max={10} scale={1.02} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-5 card-gradient-border h-full">
            <div className="text-[10.5px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">Paid</div>
            <div className="heading-display text-3xl mt-2 text-emerald-600 dark:text-emerald-400">₹{paid.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">{Math.round((paid / (total || 1)) * 100)}% collected</div>
          </div>
        </Tilt>
        <Tilt max={8} scale={1.015} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-5 card-gradient-border h-full flex items-center gap-3">
            <Donut value={paid} total={total || 1} size={90} stroke={10} />
            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">Outstanding</div>
              <div className="heading-display text-3xl text-rose-600 dark:text-rose-400">₹{due.toLocaleString()}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{list.filter(f => f.status !== 'paid').length} pending</div>
            </div>
          </div>
        </Tilt>
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-5 py-3.5">Invoice</th>
                  <th className="text-left px-5 py-3.5">Description</th>
                  <th className="text-left px-5 py-3.5">Amount</th>
                  <th className="text-left px-5 py-3.5">Due</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-right px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map(f => (
                  <tr key={f.id} className="border-t border-[var(--border-subtle)] hover:bg-cyan-50/40 dark:hover:bg-cyan-500/5 transition-colors">
                    <td className="px-5 py-3 mono text-xs">{f.invoice_no}</td>
                    <td className="px-5 py-3 font-bold">{f.description}</td>
                    <td className="px-5 py-3 font-bold">₹{Number(f.amount).toLocaleString()}</td>
                    <td className="px-5 py-3"><span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]"><Calendar size={11} />{f.due_date}</span></td>
                    <td className="px-5 py-3">
                      <span className={`chip ${f.status === 'paid' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25' : f.status === 'overdue' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'}`}>{f.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {f.status === 'paid'
                        ? <button onClick={() => handleReceipt(f)} className="btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1"><Receipt size={11} /> Receipt</button>
                        : (canEdit || user?.role === 'student' || user?.role === 'parent')
                          ? <button onClick={() => pay(f.id)} className="btn-primary !py-1.5 !px-3 text-xs">Pay now</button>
                          : <span className="text-xs text-[var(--text-muted)]">—</span>}
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
