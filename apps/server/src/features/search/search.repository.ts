import { sql, eq, and, inArray, desc } from 'drizzle-orm';
import { db } from '../../lib/db';
import { messages } from '../../db/schema/messages';
import { channels } from '../../db/schema/channels';
import { channelMembers } from '../../db/schema/channel-members';
import { users } from '../../db/schema/users';

export interface SearchResultRow {
  id: string;
  channelId: string;
  content: string;
  editedAt: Date | null;
  createdAt: Date;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  channelName: string;
  isDirectMessage: boolean;
}

function prefixQueryFromInput(input: string): string {
  const sanitized = input.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (sanitized.length === 0) return '';

  return sanitized
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => `${word}:*`)
    .join(' & ');
}

export async function searchMessages(
  workspaceId: string,
  userId: string,
  query: string,
  limit: number
): Promise<SearchResultRow[]> {
  const userChannelIds = db
    .select({ channelId: channelMembers.channelId })
    .from(channelMembers)
    .innerJoin(channels, eq(channelMembers.channelId, channels.id))
    .where(
      and(
        eq(channelMembers.userId, userId),
        eq(channels.workspaceId, workspaceId)
      )
    );

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
      channelName: channels.name,
      isDirectMessage: channels.isDirectMessage,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .innerJoin(channels, eq(messages.channelId, channels.id))
    .where(
      and(
        inArray(messages.channelId, userChannelIds),
        sql`to_tsvector('english', ${messages.content}) @@ to_tsquery('english', ${prefixQueryFromInput(query)})`
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows;
}
