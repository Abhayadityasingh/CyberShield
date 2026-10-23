import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, icon: Icon, className = '', id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          className={`w-full rounded-xl border bg-white/5 py-2.5 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 ${Icon ? 'pl-10' : 'pl-3'} ${error ? 'border-red-400/60' : 'border-white/10'}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;