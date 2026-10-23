import { Loader2 } from 'lucide-react';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50';
const variants = {
  primary:
    'bg-gradient-to-r from-cyan-400 to-blue-500 text-ink-950 shadow-[0_0_24px_-6px_rgba(34,211,238,.6)] hover:brightness-110',
  ghost: 'text-slate-300 hover:bg-white/5',
  outline: 'border border-white/15 text-slate-200 hover:border-cyan-400/50 hover:bg-white/5',
};
const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

// Use this on <Link> elements so links and buttons look identical
export const buttonStyles = (variant = 'primary', size = 'md', extra = '') =>
  `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

export default function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, ...props }) {
  return (
    <button {...props} className={buttonStyles(variant, size, className)} disabled={loading || props.disabled}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}