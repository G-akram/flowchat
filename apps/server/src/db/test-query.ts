import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { env } from '../lib/env';
import { messages } from './schema/messages';
import { users } from './schema/users';
import { reactions } from './schema/reactions';

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  const channelId = 'fc52aec4-6a7f-462c-9cd0-be6d9ea38e07';

  // eslint-disable-next-line no-console
  console.log('1. Testing message query...');
  try {
    const rows = await db
      .select({
        id: messages.id,
        channelId: messages.channelId,
        content: messages.content,
        editedAt: messages.editedAt,
        createdAt: messages.createdAt,
        userId: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.channelId, channelId))
      .orderBy(desc(messages.createdAt))
      .limit(51);

    // eslint-disable-next-line no-console
    console.log(`Found ${rows.length} messages`);

    if (rows.length > 0) {
      const messageIds = rows.map((r) => r.id);
      // eslint-disable-next-line no-console
      console.log('2. Testing reactions query...');

      const reactionRows = await db
        .select({
          messageId: reactions.messageId,
          emoji: reactions.emoji,
          count: sql<number>`count(*)::int`,
          userIds: sql<string[]>`array_agg(${reactions.userId})`,
        })
        .from(reactions)
        .where(inArray(reactions.messageId, messageIds))
        .groupBy(reactions.messageId, reactions.emoji);

      // eslint-disable-next-line no-console
      console.log(`Found ${reactionRows.length} reaction groups`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('ERROR:', err);
  }

  await pool.end();
}

// eslint-disable-next-line no-console
main().catch(console.error);
