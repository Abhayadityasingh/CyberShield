import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { SEVERITY_HEX } from '../../lib/constants.js';

export default function SeverityDonut({ data }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  const chartData = total ? data.filter((d) => d.count > 0) : [{ severity: 'none', count: 1 }];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-44 w-44" role="img" aria-label={`Threats by severity, ${total} total`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="severity" innerRadius={58} outerRadius={80} paddingAngle={total ? 3 : 0} stroke="none" isAnimationActive={false}>
              {chartData.map((d) => <Cell key={d.severity} fill={SEVERITY_HEX[d.severity] || 'rgba(255,255,255,.08)'} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">threats</p>
          </div>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.severity} className="flex items-center justify-between">
            <span className="flex items-center gap-2 capitalize text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_HEX[d.severity] }} />{d.severity}
            </span>
            <span className="font-mono text-slate-100">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}