export default function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/15" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 border-r-blue-500 animate-spin" />
      </div>
      <div className="text-[10.5px] uppercase tracking-[0.25em] font-bold">{label}</div>
    </div>
  );
}
