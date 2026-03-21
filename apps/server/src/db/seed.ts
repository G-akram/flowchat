import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema/users';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

const SEED_USERS = [
  {
    email: 'alice@flowchat.dev',
    username: 'alice',
    displayName: 'Alice',
    password: 'password123',
  },
  {
    email: 'bob@flowchat.dev',
    username: 'bob',
    displayName: 'Bob',
    password: 'password123',
  },
] as const;

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  logger.info('Seeding database...');

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await db
      .insert(users)
      .values({
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        passwordHash,
        avatarUrl: null,
      })
      .onConflictDoNothing();
    logger.info(`Seeded user: ${user.email}`);
  }

  logger.info('Seeding complete');
  await pool.end();
}

seed().catch((err: unknown) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
