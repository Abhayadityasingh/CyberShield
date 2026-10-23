export default function GlassCard({ className = '', hover = false, children, ...props }) {
  const hoverStyles = hover
    ? 'transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,.45)]'
    : '';
  return (
    <div className={`glass rounded-2xl ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}