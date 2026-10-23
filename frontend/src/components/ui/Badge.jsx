const SEVERITY = {
  info: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  low: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  medium: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
  high: 'bg-orange-500/15 text-orange-300 ring-orange-400/25',
  critical: 'bg-red-500/15 text-red-300 ring-red-400/30',
};

const pill = 'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset';

export function SeverityBadge({ severity }) {
  return <span className={`${pill} ${SEVERITY[severity] || SEVERITY.info}`}>{severity}</span>;
}

// Makes it impossible to confuse synthetic data with real observations
export function SourceBadge({ source }) {
  return source === 'simulated' ? (
    <span className={`${pill} bg-violet-500/15 text-violet-300 ring-violet-400/25`}>Simulated</span>
  ) : (
    <span className={`${pill} bg-cyan-500/15 text-cyan-300 ring-cyan-400/25`}>Observed</span>
  );
}

export function Pill({ children, className = '' }) {
  return <span className={`${pill} ${className}`}>{children}</span>;
}