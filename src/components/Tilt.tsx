import { useRef, type HTMLAttributes, type ReactNode } from 'react';

interface TiltProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  max?: number;           // max rotation degrees
  scale?: number;         // hover scale factor
  perspective?: number;   // perspective px
  glare?: boolean;        // show shine layer
  className?: string;
  disabled?: boolean;
}

export default function Tilt({ children, max = 8, scale = 1.01, perspective = 900, glare = true, className = '', disabled, ...rest }: TiltProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = +(((cy - y) / cy) * max).toFixed(2);
    const ry = +(((x - cx) / cx) * max).toFixed(2);
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', rx + 'deg');
      el.style.setProperty('--ry', ry + 'deg');
      el.style.setProperty('--mx', x + 'px');
      el.style.setProperty('--my', y + 'px');
      el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt ${className}`}
      {...rest}
    >
      {glare && <span className="tilt-shine" aria-hidden />}
      <div className="tilt-inner relative">{children}</div>
    </div>
  );
}
