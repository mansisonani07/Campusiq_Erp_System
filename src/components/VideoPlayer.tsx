import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Sparkles } from 'lucide-react';

export interface VideoPlayerProps {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  subtitle?: string;
}

export default function VideoPlayer({ open, onClose, videoId, title, subtitle }: VideoPlayerProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = original; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[960px] glass-strong rounded-3xl overflow-hidden scale-in" role="dialog" aria-modal="true" aria-label={title}>
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">{title}</div>
                {subtitle && <div className="text-[11.5px] text-slate-500 truncate">{subtitle}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[var(--border-subtle)] text-slate-500" aria-label="Open on YouTube">
                <ExternalLink size={15} />
              </a>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--border-subtle)] text-slate-500" aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </div>
          {/* Player */}
          <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={embedUrl}
              title={title}
              className="absolute inset-0 w-full h-full"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {/* Footer */}
          <div className="px-5 py-3 text-[11px] text-slate-500 flex items-center justify-between">
            <div>Press <kbd className="mono px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">ESC</kbd> to close</div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] font-bold text-slate-400">Embedded player</div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
