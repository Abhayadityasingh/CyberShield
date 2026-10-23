import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { bus } from '../events/bus.js';
import { logger } from '../utils/logger.js';

let ioRef = null;
export const connectedClients = () => ioRef?.engine?.clientsCount ?? 0;

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });
  ioRef = io;

  // Reject connections without a valid JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('role').lean();
      if (!user) return next(new Error('User not found'));
      socket.data.userId = String(user._id);
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('feed');
    socket.join(`user:${socket.data.userId}`);
    logger.info(`Socket connected (user ${socket.data.userId})`);
    socket.emit('connected', { message: 'Live feed connected' });
    socket.on('disconnect', () => logger.info(`Socket disconnected (user ${socket.data.userId})`));
  });

  // Forward internal bus announcements to connected browsers
  bus.on('security-event', (ev) => io.to('feed').emit('security-event', ev));
  bus.on('threat', (t) => io.to('feed').emit('threat', t));
  bus.on('simulation', (s) => io.to('feed').emit('simulation', s));
  bus.on('notifications', (docs) => {
    for (const n of docs) io.to(`user:${n.user}`).emit('notification', n);
  });

  return io;
}