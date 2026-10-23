export default function Select({ label, className = '', children, ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs text-slate-400">{label}</span>}
      <select
        {...props}
        className="w-full rounded-xl border border-white/10 bg-ink-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
      >
        {children}
      </select>
    </label>
  );
}