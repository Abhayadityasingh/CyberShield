import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, ShieldX, TrendingUp, Zap } from 'lucide-react';
import { api, errorMessage } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';
import { CATEGORY_LABELS } from '../lib/constants.js';
import { timeAgo } from '../lib/format.js';
import GlassCard from '../components/ui/GlassCard.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { SeverityBadge, SourceBadge } from '../components/ui/Badge.jsx';
import SimulationBanner from '../components/ui/SimulationBanner.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import RiskGauge from '../components/dashboard/RiskGauge.jsx';
import ThreatActivityChart from '../components/dashboard/ThreatActivityChart.jsx';
import SeverityDonut from '../components/dashboard/SeverityDonut.jsx';
import LiveFeedCard from '../components/events/LiveFeedCard.jsx';

const TZ_OFFSET = -new Date().getTimezoneOffset(); // minutes east of UTC

const STATUS_DOT = {
  operational: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  not_configured: 'bg-slate-500',
};

function SystemStatus({ system, loading }) {
  const rows = system && [
    ['API server', system.api, 'Operational'],
    ['Database', system.database, system.database === 'operational' ? 'Connected' : 'Degraded'],
    ['Detection engine', system.detectionEngine.status, `${system.detectionEngine.rules} rules active`],
    ['Real-time stream', system.realtime.status, `${system.realtime.clients} client${system.realtime.clients === 1 ? '' : 's'}`],
    ['ML risk service', system.mlService.status, 'Not configured yet'],
  ];
  return (
    <GlassCard className="p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100"><Activity className="h-4 w-4 text-cyan-300" /> System monitoring</h2>
      {loading || !rows ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(([name, status, note]) => (
            <li key={name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status] || 'bg-slate-500'}`} />{name}
              </span>
              <span className="text-xs text-slate-500">{note}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function RecentIncidents({ threats, loading }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100"><AlertTriangle className="h-4 w-4 text-orange-300" /> Recent incidents</h2>
        <Link to="/app/threats" className="text-xs text-cyan-300 hover:underline">View all</Link>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : threats.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No incidents in this window" description="Nothing suspicious has been detected for the selected filters." />
      ) : (
        <ul className="space-y-2">
          {threats.map((t) => (
            <li key={t._id} className="rounded-xl bg-white/[.03] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-100">{t.title}</span>
                <SeverityBadge severity={t.severity} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">{CATEGORY_LABELS[t.category]} · {t.email || t.ip}</span>
                <span className="flex shrink-0 items-center gap-2"><SourceBadge source={t.source} />{timeAgo(t.detectedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export default function Dashboard() {
  const { socket } = useSocket();
  const [range, setRange] = useState('24h');
  const [source, setSource] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get('/dashboard/summary', { params: { range, source, tzOffset: TZ_OFFSET } });
      setData(r.data);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [range, source]);

  useEffect(() => { load(); }, [load]);

  // Automatic updates: refetch (once, debounced) when new events or threats arrive
  const refreshSoon = useDebouncedCallback(() => load(true), 1200);
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('security-event', refreshSoon);
    socket.on('threat', refreshSoon);
    return () => { socket.off('security-event', refreshSoon); socket.off('threat', refreshSoon); };
  }, [socket, refreshSoon]);

  const c = data?.counts;
  const attempts = c ? c.successfulLogins + c.failedLogins : 0;
  const successRate = attempts ? `${Math.round((c.successfulLogins / attempts) * 100)}%` : '—';
  const showSimBanner = c && c.bySource.simulated > 0 && source !== 'application';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Live overview of events, threats and risk.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Time range" value={range} onChange={setRange} options={[{ value: '24h', label: '24 hours' }, { value: '7d', label: '7 days' }]} />
          <Segmented label="Data source" value={source} onChange={setSource} options={[{ value: 'all', label: 'All' }, { value: 'application', label: 'Observed' }, { value: 'simulated', label: 'Simulated' }]} />
        </div>
      </div>

      {showSimBanner && (
        <SimulationBanner
          action={source === 'all' && <Button size="sm" variant="outline" onClick={() => setSource('application')}>Show observed only</Button>}
        >
          These numbers include {c.bySource.simulated.toLocaleString()} synthetic events from the Simulation Lab. They are not real attacks.
        </SimulationBanner>
      )}

      {error && !data ? (
        <GlassCard><EmptyState icon={ShieldX} title="Could not load the dashboard" description={error} action={<Button onClick={() => load()}>Try again</Button>} /></GlassCard>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="flex flex-col justify-center p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100"><TrendingUp className="h-4 w-4 text-cyan-300" /> Security risk score</h2>
              {loading || !data ? <Skeleton className="mx-auto h-28 w-56" /> : <RiskGauge score={data.risk.score} level={data.risk.level} />}
              <p className="mt-4 text-center text-xs text-slate-500">
                Heuristic: each unresolved threat adds points (low 3, medium 8, high 18, critical 35), capped at 100. Not a guarantee of safety or compromise.
              </p>
            </GlassCard>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-3">
              <StatCard icon={Zap} label="Security events" value={c?.totalEvents.toLocaleString()} accent="cyan" loading={loading} hint="In selected window" />
              <StatCard icon={ShieldAlert} label="Threats detected" value={c?.threats.toLocaleString()} accent="violet" loading={loading} hint="Rule-based detections" />
              <StatCard icon={AlertTriangle} label="Active alerts" value={c?.activeAlerts.toLocaleString()} accent="red" loading={loading} hint="Open or investigating" />
              <StatCard icon={CheckCircle2} label="Successful logins" value={c?.successfulLogins.toLocaleString()} accent="emerald" loading={loading} />
              <StatCard icon={ShieldX} label="Failed logins" value={c?.failedLogins.toLocaleString()} accent="amber" loading={loading} />
              <StatCard icon={Activity} label="Login success rate" value={successRate} accent="blue" loading={loading} hint={attempts ? `${attempts.toLocaleString()} attempts` : 'No attempts yet'} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="p-5 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-100">Threat activity</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" />Successful</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Failed</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Threats</span>
                </div>
              </div>
              {loading || !data ? <Skeleton className="h-72 w-full" /> : <ThreatActivityChart series={data.series} range={range} />}
            </GlassCard>
            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-100">Severity distribution</h2>
              {loading || !data ? <Skeleton className="mx-auto h-64 w-44" /> : <SeverityDonut data={data.severity} />}
            </GlassCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3"><LiveFeedCard limit={10} source={source} /></div>
            <div className="space-y-4 lg:col-span-2">
              <RecentIncidents threats={data?.recentThreats || []} loading={loading} />
              <SystemStatus system={data?.system} loading={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}