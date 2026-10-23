import { useCallback, useEffect, useRef, useState } from 'react';
import { Inbox, Pause, Play, Search } from 'lucide-react';
import { api, errorMessage } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';
import { SEVERITY_HEX } from '../lib/constants.js';
import { clockTime } from '../lib/format.js';
import GlassCard from '../components/ui/GlassCard.jsx';
import Select from '../components/ui/Select.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { SeverityBadge, SourceBadge } from '../components/ui/Badge.jsx';

const MAX = 200;
const matches = (ev, f, q) =>
  (!f.severity || ev.severity === f.severity) &&
  (!f.type || ev.type === f.type) &&
  (!f.source || ev.source === f.source) &&
  (!q || `${ev.email || ''} ${ev.ip || ''} ${ev.message || ''}`.toLowerCase().includes(q.toLowerCase()));

export default function Monitoring() {
  const { socket, connected } = useSocket();
  const [filters, setFilters] = useState({ severity: '', type: '', source: '' });
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const buffer = useRef([]);

  const applySearch = useDebouncedCallback((v) => setQ(v), 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50, ...(q && { q }) };
      for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;
      const r = await api.get('/events', { params });
      setEvents(r.data.items);
      buffer.current = [];
      setBuffered(0);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filters, q]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onEvent = (ev) => {
      if (!matches(ev, filters, q)) return;
      if (paused) {
        buffer.current = [ev, ...buffer.current].slice(0, MAX);
        setBuffered(buffer.current.length);
      } else {
        setEvents((p) => [ev, ...p.filter((x) => x._id !== ev._id)].slice(0, MAX));
      }
    };
    socket.on('security-event', onEvent);
    return () => socket.off('security-event', onEvent);
  }, [socket, filters, q, paused]);

  const resume = () => {
    setEvents((p) => [...buffer.current, ...p].slice(0, MAX));
    buffer.current = [];
    setBuffered(0);
    setPaused(false);
  };

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live monitoring</h1>
          <p className="mt-1 text-sm text-slate-400">Security event timeline, streaming in real time.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 text-xs ${connected ? 'text-emerald-300' : 'text-red-300'}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />{connected ? 'Streaming' : 'Disconnected'}
          </span>
          {paused ? (
            <Button size="sm" onClick={resume}><Play className="h-4 w-4" /> Resume{buffered > 0 && ` (${buffered} new)`}</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setPaused(true)}><Pause className="h-4 w-4" /> Pause</Button>
          )}
        </div>
      </div>

      <GlassCard className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-xs text-slate-400">Search</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-slate-500" />
            <input value={qInput} onChange={(e) => { setQInput(e.target.value); applySearch(e.target.value); }}
              placeholder="Account, IP or message"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
          </label>
          <Select label="Severity" value={filters.severity} onChange={setFilter('severity')}>
            <option value="">All severities</option>
            {['critical', 'high', 'medium', 'low', 'info'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Event type" value={filters.type} onChange={setFilter('type')}>
            <option value="">All types</option>
            <option value="login_success">Login success</option>
            <option value="login_failed">Login failed</option>
            <option value="threat_detected">Threat detected</option>
          </Select>
          <div>
            <span className="mb-1 block text-xs text-slate-400">Source</span>
            <Segmented label="Source" value={filters.source} onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
              options={[{ value: '', label: 'All' }, { value: 'application', label: 'Observed' }, { value: 'simulated', label: 'Simulated' }]} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Inbox} title="Could not load events" description={error} action={<Button onClick={load}>Try again</Button>} />
        ) : events.length === 0 ? (
          <EmptyState icon={Inbox} title="No matching events" description="Nothing matches these filters yet. New matching events will appear here live." />
        ) : (
          <ol className="relative ml-3 border-l border-white/10">
            {events.map((ev) => (
              <li key={ev._id} className="relative ml-6 pb-5 last:pb-0">
                <span className="absolute -left-[30px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-ink-900" style={{ background: SEVERITY_HEX[ev.severity] }} />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-slate-500">{clockTime(ev.timestamp)}</span>
                  <SeverityBadge severity={ev.severity} />
                  <SourceBadge source={ev.source} />
                </div>
                <p className="mt-1 text-sm text-slate-200">{ev.message}</p>
                <p className="font-mono text-xs text-slate-500">{ev.ip}</p>
              </li>
            ))}
          </ol>
        )}
      </GlassCard>
    </div>
  );
}