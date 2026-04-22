/**
 * CampusIQ premium 3D vector mark.
 *
 * Minimalist isometric prism: three faceted faces imply a lit cube /
 * academic hall, with a crystalline "C" arc and IQ spark as the
 * foreground wordmark. Renders cleanly from 16px up to brand hero.
 */
export default function Logo({
  size = 34,
  withText = true,
  variant = 'default',
}: {
  size?: number;
  withText?: boolean;
  variant?: 'default' | 'light' | 'mark';
}) {
  const mark = (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="drop-shadow-[0_6px_12px_rgba(8,145,178,0.28)]"
      >
        <defs>
          {/* Prism base — deep blue to teal for the "left" face */}
          <linearGradient id="ciq-face-left" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0e7490" />
            <stop offset="1" stopColor="#1e3a8a" />
          </linearGradient>
          {/* Prism "right" face — lighter cyan/teal */}
          <linearGradient id="ciq-face-right" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#0891b2" />
          </linearGradient>
          {/* Prism "top" face — brightest highlight */}
          <linearGradient id="ciq-face-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          {/* Mono highlight */}
          <linearGradient id="ciq-ink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ecfeff" />
          </linearGradient>
          {/* Soft sheen */}
          <linearGradient id="ciq-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="ciq-softshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Isometric prism faces (academic prism) */}
        <g>
          {/* Left face  */}
          <path d="M10 22 L32 10 L32 44 L10 34 Z" fill="url(#ciq-face-left)" />
          {/* Right face */}
          <path d="M32 10 L54 22 L54 34 L32 44 Z" fill="url(#ciq-face-right)" />
          {/* Top face (highlight) */}
          <path d="M10 22 L32 10 L54 22 L32 26 Z" fill="url(#ciq-face-top)" />
          {/* Edge highlight ribbon */}
          <path d="M10 22 L32 10 L54 22" fill="none" stroke="#ecfeff" strokeOpacity="0.6" strokeWidth="0.6" strokeLinejoin="round" />
          <path d="M32 26 L32 44" fill="none" stroke="#0a0f1e" strokeOpacity="0.15" strokeWidth="0.4" />
          {/* Top sheen */}
          <path d="M10 22 L32 10 L54 22 L32 26 Z" fill="url(#ciq-sheen)" />
        </g>

        {/* Crystalline C glyph — inlaid on the right face */}
        <g filter="url(#ciq-softshadow)">
          <path
            d="M42 22.5 C38 21.3 34 22.8 33 26 C32 29 33.6 32.5 37 33.5"
            fill="none"
            stroke="url(#ciq-ink)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* IQ spark */}
          <circle cx="43.5" cy="30.5" r="1.9" fill="url(#ciq-ink)" />
          <circle cx="43.5" cy="30.5" r="0.8" fill="#22d3ee" />
        </g>

        {/* Accent micro-dot (top-right) */}
        <circle cx="53" cy="14" r="1.3" fill="#5eead4" opacity="0.95" />
      </svg>
    </div>
  );

  if (variant === 'mark' || !withText) return mark;

  const light = variant === 'light';
  return (
    <div className="flex items-center gap-2.5">
      {mark}
      <div className="leading-[1.05]">
        <div
          className={`text-[17px] font-black tracking-[-0.015em] ${light ? 'text-white' : 'text-[var(--text-primary)]'}`}
        >
          Campus
          <span className="bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 bg-clip-text text-transparent">IQ</span>
        </div>
        <div
          className={`text-[9px] font-bold uppercase tracking-[0.25em] ${light ? 'text-white/75' : 'text-[var(--text-tertiary)]'}`}
        >
          Academic OS
        </div>
      </div>
    </div>
  );
}
