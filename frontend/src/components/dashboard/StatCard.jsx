import GlassCard from '../ui/GlassCard.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

const ACCENTS = {
  cyan: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
  blue: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  red: 'bg-red-400/10 text-red-300 ring-red-400/20',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
};

export default function StatCard({ icon: Icon, label, value, hint, accent = 'cyan', loading }) {
  return (
    <GlassCard hover className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${ACCENTS[accent]}`}><Icon className="h-4 w-4" /></span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </GlassCard>
  );
}