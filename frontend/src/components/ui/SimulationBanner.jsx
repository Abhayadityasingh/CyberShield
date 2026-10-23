import { FlaskConical } from 'lucide-react';

export default function SimulationBanner({ children, action, className = '' }) {
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm ${className}`}>
      <FlaskConical className="h-5 w-5 shrink-0 text-amber-300" />
      <span className="font-mono text-xs font-semibold tracking-widest text-amber-300">SIMULATION MODE</span>
      <span className="min-w-0 flex-1 text-amber-100/80">{children}</span>
      {action}
    </div>
  );
}