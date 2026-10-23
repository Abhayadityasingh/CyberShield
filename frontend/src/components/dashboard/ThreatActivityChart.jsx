import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tick = { fill: '#64748b', fontSize: 11 };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-slate-200">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ThreatActivityChart({ series, range }) {
  const label = (t) => (range === '7d'
    ? new Date(t).toLocaleDateString([], { weekday: 'short' })
    : new Date(t).toLocaleTimeString([], { hour: 'numeric' }));
  const data = series.map((p) => ({ ...p, label: label(p.t) }));
  return (
    <div className="h-72 w-full" role="img" aria-label="Chart of successful logins, failed logins and threats over time">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gOk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis yAxisId="l" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,.15)' }} />
          <Area yAxisId="l" type="monotone" dataKey="success" name="Successful logins" stroke="#22d3ee" strokeWidth={2} fill="url(#gOk)" isAnimationActive={false} />
          <Area yAxisId="l" type="monotone" dataKey="failed" name="Failed logins" stroke="#fbbf24" strokeWidth={2} fill="url(#gFail)" isAnimationActive={false} />
          <Bar yAxisId="r" dataKey="threats" name="Threats" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}