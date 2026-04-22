import type { ReactNode } from 'react';

export default function PageHeader({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 fade-up">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-sm shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="heading-display text-[1.75rem] sm:text-[2rem] text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
