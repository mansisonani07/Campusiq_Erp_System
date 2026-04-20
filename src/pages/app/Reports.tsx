import PageHeader from '../../components/PageHeader';
import { FileText, Download, Calendar, BarChart3, Users, CreditCard, ClipboardList, GraduationCap, FileSpreadsheet } from 'lucide-react';
import Tilt from '../../components/Tilt';
import { downloadGeneric } from '../../lib/downloader';

const REPORTS = [
  { t: 'Student enrollment summary', d: 'Programs, semesters, demographics, retention', i: Users, c: 'from-cyan-500 to-teal-500', cat: 'Academic' },
  { t: 'Attendance analysis', d: 'Class-wise, subject-wise, shortage-alerts', i: ClipboardList, c: 'from-blue-500 to-indigo-600', cat: 'Academic' },
  { t: 'Exam results compilation', d: 'Grades, GPA, rank-lists, pass percentages', i: GraduationCap, c: 'from-violet-500 to-purple-600', cat: 'Academic' },
  { t: 'Fee collection report', d: 'Installments, overdues, concessions, receipts', i: CreditCard, c: 'from-emerald-500 to-teal-600', cat: 'Finance' },
  { t: 'Payroll register', d: 'Basic, allowances, TDS, bank file export', i: FileSpreadsheet, c: 'from-amber-500 to-orange-500', cat: 'Finance' },
  { t: 'Admissions funnel', d: 'Leads, applications, offers, acceptances', i: BarChart3, c: 'from-rose-500 to-pink-600', cat: 'Admissions' },
  { t: 'Library circulation', d: 'Borrow/return ratios, overdue fines, top titles', i: FileText, c: 'from-sky-500 to-blue-600', cat: 'Operations' },
  { t: 'Hostel occupancy', d: 'Block-wise utilization, vacancy trends', i: Calendar, c: 'from-lime-500 to-emerald-500', cat: 'Operations' },
  { t: 'Transport usage', d: 'Route load factors, fuel efficiency, GPS logs', i: FileText, c: 'from-cyan-500 to-teal-600', cat: 'Operations' },
];

export default function Reports() {
  const onExport = (title: string, kind: 'pdf' | 'xlsx') => {
    downloadGeneric(
      `${title.replace(/\s+/g, '_')}_${kind.toUpperCase()}`,
      `CampusIQ · ${title}`,
      [
        `Report: ${title}`,
        `Format: ${kind.toUpperCase()}`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        'Summary statistics, tabular breakdowns, and time-series charts',
        'are included in the full report. This is a placeholder file for demo.',
      ]
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Reports" subtitle="Generate and export institutional reports" icon={<FileText size={22} />} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {REPORTS.map(r => {
          const I = r.i;
          return (
            <Tilt key={r.t} max={8} scale={1.015} className="rounded-2xl">
              <div className="glass-card rounded-2xl p-5 card-gradient-border h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.c} text-white flex items-center justify-center shadow-lg`}><I size={20} /></div>
                  <span className="chip bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">{r.cat}</span>
                </div>
                <div className="mt-3 font-bold">{r.t}</div>
                <div className="text-sm text-slate-500 mt-1 flex-1">{r.d}</div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => onExport(r.t, 'pdf')} className="btn-soft !py-1.5 !px-3 text-xs inline-flex items-center gap-1 flex-1 justify-center"><Download size={11} /> PDF</button>
                  <button onClick={() => onExport(r.t, 'xlsx')} className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1 flex-1 justify-center"><FileSpreadsheet size={11} /> XLSX</button>
                </div>
              </div>
            </Tilt>
          );
        })}
      </div>
    </div>
  );
}
