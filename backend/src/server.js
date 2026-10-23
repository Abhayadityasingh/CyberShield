import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.PORT, () => logger.info(`CyberShield API running on port ${env.PORT}`));
}

start().catch((err) => {
  logger.error(err);
  process.exit(1);
});