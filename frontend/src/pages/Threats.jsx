import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, ShieldX } from 'lucide-react';
import { api, errorMessage } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/constants.js';
import { timeAgo } from '../lib/format.js';
import GlassCard from '../components/ui/GlassCard.jsx';
import Select from '../components/ui/Select.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Pill, SeverityBadge, SourceBadge } from '../components/ui/Badge.jsx';
import ThreatDrawer from '../components/threats/ThreatDrawer.jsx';

const EMPTY_FILTERS = { severity: '', category: '', status: '', source: '' };

export default function Threats() {
  const { socket } = useSocket();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const applySearch = useDebouncedCallback((v) => { setQ(v); setPage(1); }, 400);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { page, limit: 15, ...(q && { q }) };
      for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;
      const r = await api.get('/threats', { params });
      setData(r.data);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, filters, q]);

  useEffect(() => { load(); }, [load]);

  const refreshSoon = useDebouncedCallback(() => load(true), 1000);
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('threat', refreshSoon);
    return () => socket.off('threat', refreshSoon);
  }, [socket, refreshSoon]);

  const setFilter = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1); };
  const hasFilters = q || Object.values(filters).some(Boolean);
  const reset = () => { setFilters(EMPTY_FILTERS); setQ(''); setQInput(''); setPage(1); };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Threat detection</h1>
        <p className="mt-1 text-sm text-slate-400">Every detection with its category, severity, explanation and method.</p>
      </div>

      <GlassCard className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="relative block lg:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">Search</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-slate-500" />
            <input value={qInput} onChange={(e) => { setQInput(e.target.value); applySearch(e.target.value); }}
              placeholder="Account, IP or title"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
          </label>
          <Select label="Severity" value={filters.severity} onChange={setFilter('severity')}>
            <option value="">All severities</option>
            {['critical', 'high', 'medium', 'low'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Category" value={filters.category} onChange={setFilter('category')}>
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select label="Status" value={filters.status} onChange={setFilter('status')}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select label="Source" value={filters.source} onChange={setFilter('source')}>
            <option value="">All sources</option>
            <option value="application">Observed</option>
            <option value="simulated">Simulated</option>
          </Select>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={ShieldX} title="Could not load threats" description={error} action={<Button onClick={() => load()}>Try again</Button>} />
        ) : data.items.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={hasFilters ? 'No threats match these filters' : 'No threats detected yet'}
            description={hasFilters ? 'Try widening your filters.' : 'When the detection engine flags suspicious activity, it appears here.'}
            action={hasFilters && <Button variant="outline" onClick={reset}>Clear filters</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-3 py-3 font-medium">Threat</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Risk</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Detected</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.items.map((t) => (
                  <tr key={t._id} tabIndex={0} onClick={() => setSelectedId(t._id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(t._id); }}
                    className="cursor-pointer transition hover:bg-white/[.04] focus:bg-white/[.04] focus:outline-none">
                    <td className="px-5 py-3"><SeverityBadge severity={t.severity} /></td>
                    <td className="max-w-xs px-3 py-3">
                      <p className="truncate font-medium text-slate-100">{t.title}</p>
                      <p className="truncate font-mono text-xs text-slate-500">{t.email || t.ip}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{CATEGORY_LABELS[t.category]}</td>
                    <td className="px-3 py-3 font-mono text-slate-200">{t.riskScore}</td>
                    <td className="px-3 py-3"><Pill className="bg-white/5 text-slate-300 ring-white/10">{STATUS_LABELS[t.status]}</Pill></td>
                    <td className="px-3 py-3 text-xs text-slate-400" title={new Date(t.detectedAt).toLocaleString()}>{timeAgo(t.detectedAt)}</td>
                    <td className="px-5 py-3"><SourceBadge source={t.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && data.items.length > 0 && <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />}
      </GlassCard>

      <ThreatDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={() => load(true)} />
    </div>
  );
}