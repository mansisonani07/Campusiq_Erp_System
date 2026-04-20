import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { BookOpen, Play, FileText as FileIcon, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '../../components/Charts';
import Loader from '../../components/Loader';
import Tilt from '../../components/Tilt';
import VideoPlayer from '../../components/VideoPlayer';

/** Fallback YouTube video ids keyed by course_code so the LMS always plays something sensible. */
const VIDEO_FALLBACK: Record<string, string> = {
  'CS-301': 'RBSGKlAvoiM', // DSA
  'CS-401': '26QPDBe-NB8', // Operating Systems
  'CS-501': '4cWkVbC2bNE', // Databases
  'CS-502': 'IPvYjXCsTg8', // Networks
  'CS-601': 'KNAWp2S3w94', // Machine Learning
  'HS-201': '3E3gJaw-0QU', // Technical Communication
};
const GENERIC_FALLBACK = 'dQw4w9WgXcQ'; // safe, always-available

export default function LMS() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<{ open: boolean; videoId: string; title: string; subtitle?: string }>({ open: false, videoId: '', title: '' });

  useEffect(() => { (async () => { try { setList(await api('/api/lms')); } finally { setLoading(false); } })(); }, []);

  const playModule = (m: any) => {
    const videoId = (m.video_id && String(m.video_id)) || VIDEO_FALLBACK[m.course_code] || GENERIC_FALLBACK;
    setPlayer({
      open: true,
      videoId,
      title: m.title,
      subtitle: `${m.course_code || ''}${m.category ? ' · ' + m.category : ''}`,
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Learning Portal" subtitle="Course materials, videos, quizzes and certificates" icon={<BookOpen size={22} />} />
      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map(m => {
            const progress = m.progress_pct || 0;
            return (
              <Tilt key={m.id} max={8} scale={1.02} className="rounded-2xl">
                <div className="glass-card rounded-2xl overflow-hidden card-gradient-border h-full flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 relative">
                    <div className="absolute inset-0 bg-grid opacity-25" />
                    <div className="absolute top-3 left-3 chip bg-white/20 text-white border border-white/30">{m.category || 'Core'}</div>
                    {progress === 100 && <div className="absolute top-3 right-3 chip bg-emerald-400/90 text-emerald-950"><CheckCircle2 size={10} /> Complete</div>}
                    <div className="absolute bottom-3 left-3 right-3 text-white font-bold text-lg line-clamp-1">{m.title}</div>
                    <button onClick={() => playModule(m)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center hover:scale-110 transition-transform opacity-0 hover:opacity-100 group"
                      aria-label="Play preview"
                    >
                      <Play size={18} fill="white" />
                    </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-slate-500 line-clamp-2">{m.description}</div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1"><span>Progress</span><span className="font-bold text-cyan-600">{progress}%</span></div>
                      <ProgressBar value={progress} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[10px] uppercase tracking-wider text-slate-500">
                      <div><Play size={11} className="mx-auto text-cyan-500" /><div className="font-bold text-sm mt-0.5 text-[var(--text-primary)]">{m.videos_count || 12}</div>Videos</div>
                      <div><FileIcon size={11} className="mx-auto text-blue-500" /><div className="font-bold text-sm mt-0.5 text-[var(--text-primary)]">{m.readings_count || 8}</div>Readings</div>
                      <div><CheckCircle2 size={11} className="mx-auto text-emerald-500" /><div className="font-bold text-sm mt-0.5 text-[var(--text-primary)]">{m.quizzes_count || 4}</div>Quizzes</div>
                    </div>
                    <button onClick={() => playModule(m)} className="btn-primary w-full mt-auto !mt-4 !py-2 text-xs inline-flex items-center justify-center gap-1.5">
                      <Play size={11} fill="white" />
                      {progress === 100 ? 'Review module' : progress > 0 ? 'Continue learning' : 'Start module'}
                    </button>
                  </div>
                </div>
              </Tilt>
            );
          })}
        </div>
      )}

      <VideoPlayer
        open={player.open}
        onClose={() => setPlayer(p => ({ ...p, open: false }))}
        videoId={player.videoId}
        title={player.title}
        subtitle={player.subtitle}
      />
    </div>
  );
}
