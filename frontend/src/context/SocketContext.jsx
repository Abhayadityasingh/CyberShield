import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_URL, tokenStore } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext({ socket: null, connected: false });
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const s = io(API_URL, { auth: { token: tokenStore.get() } });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));
    s.on('threat', (t) => {
      if (t.severity === 'high' || t.severity === 'critical') {
        const tag = t.source === 'simulated' ? ' [SIMULATED]' : '';
        toast.error(`${t.severity.toUpperCase()}: ${t.title}${tag}`, { duration: 5000 });
      }
    });
    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}