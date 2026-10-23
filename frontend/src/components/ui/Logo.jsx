import { ShieldCheck } from 'lucide-react';

export default function Logo({ compact = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 ring-1 ring-cyan-400/30 shadow-[0_0_20px_-4px_rgba(34,211,238,.6)]">
        <ShieldCheck className="h-5 w-5 text-cyan-300" />
      </span>
      {!compact && <span className="text-lg font-bold tracking-tight text-white">Cyber<span className="text-cyan-300">Shield</span></span>}
    </span>
  );
}