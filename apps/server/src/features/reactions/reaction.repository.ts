import { eq, and, sql, inArray } from 'drizzle-orm';
import { db } from '../../lib/db';
import { reactions } from '../../db/schema/reactions';
import { messages } from '../../db/schema/messages';

export interface ReactionAggregate {
  emoji: string;
  count: number;
  userIds: string[];
}

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await db
    .insert(reactions)
    .values({ messageId, userId, emoji })
    .onConflictDoNothing();
}

export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, emoji)
      )
    );
}

export async function getReactionsForMessage(messageId: string): Promise<ReactionAggregate[]> {
  const rows = await db
    .select({
      emoji: reactions.emoji,
      count: sql<number>`count(*)::int`,
      userIds: sql<string[]>`array_agg(${reactions.userId})`,
    })
    .from(reactions)
    .where(eq(reactions.messageId, messageId))
    .groupBy(reactions.emoji);

  return rows.map((row) => ({
    emoji: row.emoji,
    count: row.count,
    userIds: row.userIds,
  }));
}

export async function getReactionsForMessages(
  messageIds: string[]
): Promise<Map<string, ReactionAggregate[]>> {
  if (messageIds.length === 0) return new Map();

  const rows = await db
    .select({
      messageId: reactions.messageId,
      emoji: reactions.emoji,
      count: sql<number>`count(*)::int`,
      userIds: sql<string[]>`array_agg(${reactions.userId})`,
    })
    .from(reactions)
    .where(inArray(reactions.messageId, messageIds))
    .groupBy(reactions.messageId, reactions.emoji);

  const result = new Map<string, ReactionAggregate[]>();

  for (const row of rows) {
    const existing = result.get(row.messageId) ?? [];
    existing.push({
      emoji: row.emoji,
      count: row.count,
      userIds: row.userIds,
    });
    result.set(row.messageId, existing);
  }

  return result;
}

export async function findMessageChannelId(messageId: string): Promise<string | undefined> {
  const result = await db
    .select({ channelId: messages.channelId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  return result[0]?.channelId;
}
