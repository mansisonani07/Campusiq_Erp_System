import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { BarChart, Donut, LineChart, ProgressBar } from '../../components/Charts';
import Tilt from '../../components/Tilt';

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { (async () => { setStats(await api('/api/stats')); })(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Analytics" subtitle="Live KPIs and institutional intelligence" icon={<BarChart3 size={22} />} />

      <div className="grid lg:grid-cols-4 gap-4 mb-5 stagger">
        {[
          { l: 'Student retention', v: '94.8%', t: '+2.1%', up: true, c: 'from-cyan-500 to-teal-500' },
          { l: 'Placement ratio', v: '87.2%', t: '+4.5%', up: true, c: 'from-blue-500 to-indigo-600' },
          { l: 'Avg attendance', v: '91.3%', t: '+1.4%', up: true, c: 'from-violet-500 to-purple-600' },
          { l: 'Dropout risk', v: '3.1%', t: '-0.7%', up: false, c: 'from-rose-500 to-pink-600' },
        ].map(s => (
          <Tilt key={s.l} max={10} scale={1.02} className="rounded-2xl">
            <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${s.c} relative overflow-hidden elev-2 h-full`}>
              <div className="absolute inset-0 bg-grid opacity-15" />
              <div className="relative">
                <div className="text-xs uppercase tracking-wider opacity-80 font-bold">{s.l}</div>
                <div className="heading-display text-4xl mt-2">{s.v}</div>
                <div className="chip bg-white/20 text-white border border-white/30 mt-2 inline-flex">{s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {s.t}</div>
              </div>
            </div>
          </Tilt>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Tilt max={4} scale={1.005} className="lg:col-span-2 rounded-2xl">
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-3">
              <div><div className="text-sm font-bold">Enrollment over 12 months</div><div className="text-xs text-slate-500">Monthly new admissions</div></div>
              <div className="chip bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">2024</div>
            </div>
            <div className="text-[var(--text-secondary)]"><LineChart data={[120, 140, 155, 148, 182, 210, 235, 225, 260, 288, 310, 325]} labels={['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']} height={220} /></div>
          </div>
        </Tilt>
        <Tilt max={6} scale={1.01} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center h-full">
            <div className="text-sm font-bold mb-3">Gender distribution</div>
            <Donut value={58} total={100} label="Male" sub="58% / 42%" />
            <div className="text-xs text-slate-500 mt-3">Institution-wide</div>
          </div>
        </Tilt>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Tilt max={5} scale={1.005} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="text-sm font-bold mb-3">Department performance</div>
            <div className="space-y-3">
              {[{ n: 'Computer Science', p: 94 }, { n: 'Electronics', p: 89 }, { n: 'Mechanical', p: 86 }, { n: 'Civil', p: 82 }, { n: 'MBA', p: 91 }, { n: 'Commerce', p: 78 }].map(d => (
                <div key={d.n}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-semibold">{d.n}</span><span className="font-bold text-cyan-600">{d.p}%</span></div>
                  <ProgressBar value={d.p} />
                </div>
              ))}
            </div>
          </div>
        </Tilt>
        <Tilt max={5} scale={1.005} className="rounded-2xl">
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="text-sm font-bold mb-3">Fee collection by program</div>
            <div className="text-[var(--text-secondary)]"><BarChart data={[82, 76, 68, 58, 91, 86]} labels={['CSE', 'ECE', 'MECH', 'CIVIL', 'MBA', 'COM']} height={220} /></div>
          </div>
        </Tilt>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Target size={14} className="text-cyan-500" /> KPI tracker</div>
        <div className="grid md:grid-cols-3 gap-4 stagger">
          {[
            { l: 'Student satisfaction (NPS)', v: 68, goal: 75 },
            { l: 'Faculty retention', v: 92, goal: 90 },
            { l: 'Library utilization', v: 54, goal: 70 },
            { l: 'LMS engagement', v: 81, goal: 80 },
            { l: 'Infra uptime', v: 99.9, goal: 99.9 },
            { l: 'Ticket resolution SLA', v: 88, goal: 95 },
          ].map(k => (
            <Tilt key={k.l} max={8} scale={1.02} className="rounded-xl">
              <div className="p-3 rounded-xl bg-[var(--bg-inset)] h-full card-gradient-border">
                <div className="text-xs text-slate-500 flex justify-between"><span>{k.l}</span><span>Goal {k.goal}</span></div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-xl font-extrabold">{k.v}{k.l.includes('uptime') ? '%' : ''}</div>
                  {k.v >= k.goal ? <span className="chip bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">on track</span> : <span className="chip bg-amber-500/10 text-amber-600 border border-amber-500/20">below</span>}
                </div>
                <div className="mt-2"><ProgressBar value={Math.min(100, (k.v / k.goal) * 100)} /></div>
              </div>
            </Tilt>
          ))}
        </div>
      </div>
    </div>
  );
}
