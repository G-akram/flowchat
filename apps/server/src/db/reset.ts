import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

async function reset(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  logger.info('Truncating all tables...');
  await db.execute(
    sql`TRUNCATE channel_members, channels, workspace_members, workspaces, refresh_tokens, users CASCADE`
  );
  logger.info('All tables truncated');

  await pool.end();
}

reset().catch((err: unknown) => {
  console.error('Reset failed', err);
  process.exit(1);
});
