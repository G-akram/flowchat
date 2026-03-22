import 'dotenv/config';
import http from 'http';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { app } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { pool } from './lib/db';
import { redis } from './lib/redis';
import { initSocketServer } from './socket/socket.server';

const httpServer = http.createServer(app);

initSocketServer(httpServer);

async function runMigrationsIfDev(): Promise<void> {
  if (env.NODE_ENV !== 'development') return;

  logger.info('Running database migrations (development mode)...');
  const migrationDb = drizzle(pool);
  await migrate(migrationDb, {
    migrationsFolder: path.join(__dirname, '../drizzle'),
  });
  logger.info('Migrations completed');
}

async function start(): Promise<void> {
  await runMigrationsIfDev();
  await redis.connect();

  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
  });
}

start().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
