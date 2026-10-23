import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Radio } from 'lucide-react';
import { api, errorMessage } from '../../lib/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { clockTime } from '../../lib/format.js';
import GlassCard from '../ui/GlassCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { SeverityBadge, SourceBadge } from '../ui/Badge.jsx';

export default function LiveFeedCard({ limit = 10, source = 'all' }) {
  const { socket, connected } = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
   api.get('/events', { params: { limit, ...(source !== 'all' ? { source } : {}) } })
      .then((r) => alive && setEvents(r.data.items))
      .catch((e) => alive && setError(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
 }, [limit, source]);

  useEffect(() => {
    if (!socket) return undefined;
    const onEvent = (ev) => {
  if (source !== 'all' && ev.source !== source) return;
  setEvents((p) => [ev, ...p.filter((x) => x._id !== ev._id)].slice(0, limit));
};
    socket.on('security-event', onEvent);
    return () => socket.off('security-event', onEvent);
}, [socket, limit, source]);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
          <Radio className={`h-4 w-4 ${connected ? 'text-emerald-400' : 'text-slate-500'}`} /> Live event feed
        </div>
        <Link to="/app/monitoring" className="text-xs text-cyan-300 hover:underline">Open monitoring</Link>
      </div>
      {loading ? (
        <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
      ) : error ? (
        <EmptyState icon={Inbox} title="Could not load events" description={error} />
      ) : events.length === 0 ? (
        <EmptyState icon={Inbox} title="No events yet" description="Events appear here as logins are recorded. Run a scenario in the Simulation Lab to see the pipeline live." />
      ) : (
        <ul className="divide-y divide-white/5">
          {events.map((ev) => (
            <li key={ev._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
              <span className="font-mono text-xs text-slate-500">{clockTime(ev.timestamp)}</span>
              <SeverityBadge severity={ev.severity} />
              <span className="min-w-0 flex-1 basis-48 truncate text-slate-200">{ev.message}</span>
              <SourceBadge source={ev.source} />
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}