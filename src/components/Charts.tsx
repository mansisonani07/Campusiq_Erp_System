import { useMemo } from 'react';

export function LineChart({ data, labels, color = '#06b6d4', color2 = '#1e40af', height = 200 }: { data: number[]; labels?: string[]; color?: string; color2?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const W = 600, H = height, P = 26;
  const sx = (i: number) => P + (i * (W - P * 2)) / Math.max(data.length - 1, 1);
  const sy = (v: number) => P + (H - P * 2) * (1 - (v - min) / Math.max(max - min, 1));
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
  const area = `${path} L ${sx(data.length - 1)} ${H - P} L ${sx(0)} ${H - P} Z`;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`lcf-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.4" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`lcs-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={color2} />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => <line key={i} x1={P} x2={W - P} y1={P + (H - P * 2) * i / 3} y2={P + (H - P * 2) * i / 3} stroke="currentColor" strokeOpacity="0.07" />)}
      <path d={area} fill={`url(#lcf-${uid})`} />
      <path d={path} fill="none" stroke={`url(#lcs-${uid})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => <circle key={i} cx={sx(i)} cy={sy(v)} r="3.5" fill="white" stroke={color2} strokeWidth="2" />)}
      {labels && labels.map((l, i) => <text key={i} x={sx(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5" fontWeight="600">{l}</text>)}
    </svg>
  );
}

export function BarChart({ data, labels, colors = ['#06b6d4', '#1e40af'], height = 200 }: { data: number[]; labels?: string[]; colors?: string[]; height?: number }) {
  const max = Math.max(...data, 1);
  const W = 600, H = height, P = 26;
  const bw = (W - P * 2) / data.length * 0.62;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`bcg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => <line key={i} x1={P} x2={W - P} y1={P + (H - P * 2) * i / 3} y2={P + (H - P * 2) * i / 3} stroke="currentColor" strokeOpacity="0.06" />)}
      {data.map((v, i) => {
        const x = P + (i * (W - P * 2)) / data.length + ((W - P * 2) / data.length - bw) / 2;
        const h = (H - P * 2) * (v / max);
        return <g key={i}>
          <rect x={x} y={H - P - h} width={bw} height={h} fill={`url(#bcg-${uid})`} rx="5" />
          {labels && <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5" fontWeight="600">{labels[i]}</text>}
          <text x={x + bw / 2} y={H - P - h - 5} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.75" fontWeight="700">{v}</text>
        </g>;
      })}
    </svg>
  );
}

export function Donut({ value, total, size = 160, stroke = 14, label, sub }: { value: number; total: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const pct = useMemo(() => Math.min(1, value / Math.max(total, 1)), [value, total]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id={`dg-${uid}`} x1="0" x2="1">
            <stop offset="0" stopColor="#06b6d4" />
            <stop offset="0.5" stopColor="#0891b2" />
            <stop offset="1" stopColor="#1e40af" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.09" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#dg-${uid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="heading-display text-2xl text-slate-900 dark:text-white">{Math.round(pct * 100)}%</div>
        {label && <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{label}</div>}
        {sub && <div className="text-[10px] text-slate-400 mt-0.5 px-2">{sub}</div>}
      </div>
    </div>
  );
}

export function Sparkline({ data, color = '#06b6d4' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const W = 120, H = 36;
  const sx = (i: number) => (i * W) / Math.max(data.length - 1, 1);
  const sy = (v: number) => H * (1 - (v - min) / Math.max(max - min, 1));
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-[120px] h-[36px]">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProgressBar({ value, color = 'from-cyan-500 to-blue-600' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 shadow-sm`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
