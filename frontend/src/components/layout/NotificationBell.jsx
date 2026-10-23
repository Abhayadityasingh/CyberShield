import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../../lib/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { timeAgo } from '../../lib/format.js';
import { SeverityBadge } from '../ui/Badge.jsx';

export default function NotificationBell() {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    api.get('/notifications')
      .then((r) => { setItems(r.data.items); setUnread(r.data.unread); })
      .catch(() => { /* the bell is optional; stay quiet */ });
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onNotification = (n) => {
      setItems((prev) => [n, ...prev.filter((x) => x._id !== n._id)].slice(0, 50));
      setUnread((c) => c + 1);
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [socket]);

  useEffect(() => {
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const markAll = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) { toast.error(errorMessage(err)); }
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-white/5"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-ink-900/95 p-2 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold text-slate-100">Notifications</span>
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">You are all caught up.</p>
            ) : (
              items.map((n) => (
                <div key={n._id} className={`rounded-xl px-3 py-2.5 ${n.read ? 'opacity-60' : 'bg-white/[.03]'}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-100">{n.title}</span>
                    <SeverityBadge severity={n.severity} />
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-400">{n.message}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-600">{timeAgo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}