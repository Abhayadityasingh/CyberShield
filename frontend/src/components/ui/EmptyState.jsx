export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
          <Icon className="h-6 w-6 text-cyan-300" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}