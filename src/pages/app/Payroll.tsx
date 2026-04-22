import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { DollarSign, Download, TrendingUp } from 'lucide-react';
import { BarChart } from '../../components/Charts';
import Loader from '../../components/Loader';
import Tilt from '../../components/Tilt';
import { downloadGeneric, downloadPayslip } from '../../lib/downloader';

export default function Payroll() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setList(await api('/api/payroll')); } finally { setLoading(false); } })(); }, []);

  const total = list.reduce((a, b) => a + Number(b.net_pay || 0), 0);
  const periods = Array.from(new Set(list.map(l => l.pay_period))).slice(0, 6).reverse();
  const periodData = periods.map(p => list.filter(l => l.pay_period === p).reduce((a, b) => a + Number(b.net_pay || 0), 0) / 100000);

  const onPayslip = (p: any) => {
    downloadPayslip({
      employeeName: p.employee_name,
      employeeId: p.employee_id,
      designation: p.designation,
      payPeriod: p.pay_period,
      basic: Number(p.basic),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      netPay: Number(p.net_pay),
      status: p.status,
    });
  };

  const onBulkRegister = () => {
    const lines = list.map(p => `${p.pay_period}  ${p.employee_id}  ${p.employee_name}  -  Rs ${Number(p.net_pay).toLocaleString()}  -  ${p.status}`);
    downloadGeneric('Payroll_Register', 'CampusIQ · Payroll Register', [
      `Generated: ${new Date().toLocaleString()}`,
      `Records: ${list.length}`,
      '',
      ...lines,
      '',
      `Total disbursed: Rs ${total.toLocaleString()}`,
    ]);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Payroll" subtitle="Faculty & staff salary processing" icon={<DollarSign size={22} />}
        actions={<button onClick={onBulkRegister} className="btn-primary inline-flex items-center gap-2"><Download size={14} /> Export register</button>} />

      <div className="grid lg:grid-cols-4 gap-4 mb-5 stagger">
        <Tilt max={10} scale={1.02} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-5 h-full card-gradient-border">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total disbursed</div>
            <div className="heading-display text-3xl mt-1">₹{(total / 100000).toFixed(2)}L</div>
            <div className="chip bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mt-2"><TrendingUp size={10} /> +3.2% MoM</div>
          </div>
        </Tilt>
        <Tilt max={10} scale={1.02} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-5 h-full card-gradient-border">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Employees</div>
            <div className="heading-display text-3xl mt-1">{new Set(list.map(l => l.employee_id)).size}</div>
          </div>
        </Tilt>
        <Tilt max={4} scale={1.005} className="rounded-2xl lg:col-span-2">
          <div className="glass-card rounded-2xl p-5 h-full">
            <div className="text-sm font-bold mb-1">Monthly disbursement trend (₹ Lakhs)</div>
            <div className="text-[var(--text-secondary)]"><BarChart data={periodData.length ? periodData.map(v => Math.round(v)) : [34, 36, 35, 38, 40, 42]} labels={periods.length ? periods.map(p => p.slice(5)) : ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']} height={130} /></div>
          </div>
        </Tilt>
      </div>

      {loading ? <Loader /> : (
        <div className="surface-solid rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-5 py-3.5">Employee</th>
                  <th className="text-left px-5 py-3.5">Role</th>
                  <th className="text-left px-5 py-3.5">Period</th>
                  <th className="text-right px-5 py-3.5">Basic</th>
                  <th className="text-right px-5 py-3.5">Allowances</th>
                  <th className="text-right px-5 py-3.5">Deductions</th>
                  <th className="text-right px-5 py-3.5">Net pay</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-right px-5 py-3.5">Slip</th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} className="border-t border-[var(--border-subtle)] hover:bg-cyan-50/40 dark:hover:bg-cyan-500/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-bold">{p.employee_name}</div>
                      <div className="text-[11px] text-slate-500 mono">{p.employee_id}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{p.designation}</td>
                    <td className="px-5 py-3 mono text-xs">{p.pay_period}</td>
                    <td className="px-5 py-3 text-right">₹{Number(p.basic).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-emerald-600">+₹{Number(p.allowances).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-rose-600">-₹{Number(p.deductions).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold">₹{Number(p.net_pay).toLocaleString()}</td>
                    <td className="px-5 py-3"><span className={`chip ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>{p.status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => onPayslip(p)} className="btn-ghost !py-1 !px-2 text-[11px] inline-flex items-center gap-1"><Download size={11} /> PDF</button>
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
