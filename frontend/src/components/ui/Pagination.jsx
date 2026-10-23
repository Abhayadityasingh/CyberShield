import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onChange }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-xs text-slate-400">
      <span>{total.toLocaleString()} result{total === 1 ? '' : 's'}</span>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"
            className="grid h-8 w-8 place-items-center rounded-lg ring-1 ring-white/10 hover:bg-white/5 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono">{page} / {pages}</span>
          <button onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page"
            className="grid h-8 w-8 place-items-center rounded-lg ring-1 ring-white/10 hover:bg-white/5 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}