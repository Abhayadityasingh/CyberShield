import { EventEmitter } from 'node:events';

// Internal "announcement board". Services emit here, and Socket.IO (Phase 3) listens.
export const bus = new EventEmitter();