import { RISK_COLORS } from '../../lib/constants.js';

const ARC = Math.PI * 80; // length of the half circle

export default function RiskGauge({ score = 0, level = 'low' }) {
  const color = RISK_COLORS[level] || RISK_COLORS.low;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  return (
    <div className="relative mx-auto w-56" role="img" aria-label={`Risk score ${score} out of 100, level ${level}`}>
      <svg viewBox="0 0 200 115" className="w-full">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${pct * ARC} ${ARC}`} style={{ transition: 'stroke-dasharray .6s ease, stroke .3s' }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-4xl font-bold leading-none" style={{ color }}>{score}</div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-slate-400">{level}</div>
      </div>
    </div>
  );
}