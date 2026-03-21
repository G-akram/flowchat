import { eq, and, lt, desc } from 'drizzle-orm';
import { db } from '../../lib/db';
import { messages, type DbMessage } from '../../db/schema/messages';
import { users } from '../../db/schema/users';
import { channelMembers } from '../../db/schema/channel-members';

export interface MessageWithUser {
  id: string;
  channelId: string;
  content: string;
  editedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export async function createMessage(input: {
  channelId: string;
  userId: string;
  content: string;
}): Promise<MessageWithUser> {
  const result = await db.insert(messages).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to create message');
  }

  const userResult = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, created.userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: created.id,
    channelId: created.channelId,
    content: created.content,
    editedAt: created.editedAt,
    createdAt: created.createdAt,
    user: { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl },
  };
}

export async function findMessageById(id: string): Promise<DbMessage | undefined> {
  const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return result[0];
}

export async function findMessagesWithUser(
  channelId: string,
  limit: number,
  cursor?: string
): Promise<MessageWithUser[]> {
  let query = db
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
    .limit(limit + 1)
    .$dynamic();

  if (cursor) {
    const cursorMsg = await findMessageById(cursor);
    if (cursorMsg) {
      query = query.where(
        and(eq(messages.channelId, channelId), lt(messages.createdAt, cursorMsg.createdAt))
      );
    }
  }

  const rows = await query;

  return rows.map((row) => ({
    id: row.id,
    channelId: row.channelId,
    content: row.content,
    editedAt: row.editedAt,
    createdAt: row.createdAt,
    user: { id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl },
  }));
}

export async function updateMessageContent(
  id: string,
  content: string
): Promise<MessageWithUser | undefined> {
  const result = await db
    .update(messages)
    .set({ content, editedAt: new Date() })
    .where(eq(messages.id, id))
    .returning();

  const updated = result[0];

  if (!updated) {
    return undefined;
  }

  const userResult = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, updated.userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    return undefined;
  }

  return {
    id: updated.id,
    channelId: updated.channelId,
    content: updated.content,
    editedAt: updated.editedAt,
    createdAt: updated.createdAt,
    user: { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl },
  };
}

export async function deleteMessage(id: string): Promise<void> {
  await db.delete(messages).where(eq(messages.id, id));
}

export async function findChannelMember(
  channelId: string,
  userId: string
): Promise<{ channelId: string; userId: string } | undefined> {
  const result = await db
    .select({
      channelId: channelMembers.channelId,
      userId: channelMembers.userId,
    })
    .from(channelMembers)
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      )
    )
    .limit(1);

  return result[0];
}
