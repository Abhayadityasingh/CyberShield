import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-ink-950/70 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 hover:bg-white/5 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ring-inset ${
          connected ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' : 'bg-red-500/10 text-red-300 ring-red-400/20'
        }`}
        role="status"
      >
        <span className="relative flex h-2 w-2">
          {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        </span>
        {connected ? 'Live' : 'Offline'}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-100">{user?.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{user?.role}</p>
        </div>
        <button onClick={signOut} aria-label="Sign out" title="Sign out" className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-white/5 hover:text-red-300">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}