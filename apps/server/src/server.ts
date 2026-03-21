import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { redis } from './lib/redis';
import { initSocketServer } from './socket/socket.server';

const httpServer = http.createServer(app);

initSocketServer(httpServer);

async function start(): Promise<void> {
  await redis.connect();

  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
  });
}

start().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
