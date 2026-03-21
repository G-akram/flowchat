import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

async function runMigrations(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  logger.info('Running database migrations...');

  await migrate(db, {
    migrationsFolder: path.join(__dirname, '../../drizzle'),
  });

  logger.info('Migrations completed successfully');
  await pool.end();
}

runMigrations().catch((err: unknown) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
