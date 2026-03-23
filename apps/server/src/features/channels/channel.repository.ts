import { eq, and, ne, asc, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { channels, type DbChannel } from '../../db/schema/channels';
import { channelMembers, type DbChannelMember } from '../../db/schema/channel-members';
import { workspaceMembers } from '../../db/schema/workspace-members';
import { users } from '../../db/schema/users';

export async function createChannel(input: {
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdById: string;
}): Promise<DbChannel> {
  const result = await db.insert(channels).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to create channel');
  }

  return created;
}

export async function findChannelById(id: string): Promise<DbChannel | undefined> {
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0];
}

export async function findChannelsByUserInWorkspace(
  workspaceId: string,
  userId: string
): Promise<DbChannel[]> {
  const result = await db
    .select({ channel: channels })
    .from(channelMembers)
    .innerJoin(channels, eq(channelMembers.channelId, channels.id))
    .where(
      and(
        eq(channels.workspaceId, workspaceId),
        eq(channelMembers.userId, userId)
      )
    );

  return result.map((r) => r.channel);
}

export async function addChannelMember(input: {
  channelId: string;
  userId: string;
}): Promise<DbChannelMember> {
  const result = await db.insert(channelMembers).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to add channel member');
  }

  return created;
}

export async function findChannelMember(
  channelId: string,
  userId: string
): Promise<DbChannelMember | undefined> {
  const result = await db
    .select()
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

export async function updateChannel(
  id: string,
  input: { name?: string; description?: string | null }
): Promise<DbChannel | undefined> {
  const result = await db
    .update(channels)
    .set(input)
    .where(eq(channels.id, id))
    .returning();
  return result[0];
}

export async function deleteChannel(id: string): Promise<void> {
  await db.delete(channels).where(eq(channels.id, id));
}

export async function removeChannelMember(
  channelId: string,
  userId: string
): Promise<void> {
  await db
    .delete(channelMembers)
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      )
    );
}

export async function findWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<{ workspaceId: string; userId: string; role: string } | undefined> {
  const result = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  return result[0];
}

export interface ChannelMemberProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: string;
}

export async function findNextChannelOwner(
  channelId: string,
  workspaceId: string,
  excludeUserId: string
): Promise<{ userId: string } | undefined> {
  const result = await db
    .select({
      userId: channelMembers.userId,
      role: workspaceMembers.role,
      joinedAt: channelMembers.joinedAt,
    })
    .from(channelMembers)
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.userId, channelMembers.userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        ne(channelMembers.userId, excludeUserId)
      )
    )
    .orderBy(
      sql`CASE ${workspaceMembers.role} WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END`,
      asc(channelMembers.joinedAt)
    )
    .limit(1);

  return result[0] ? { userId: result[0].userId } : undefined;
}

export async function markChannelRead(channelId: string, userId: string): Promise<void> {
  await db
    .update(channelMembers)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      )
    );
}

export interface UnreadCount {
  channelId: string;
  unreadCount: number;
}

export async function getUnreadCountsForUser(
  userId: string,
  workspaceId: string
): Promise<UnreadCount[]> {
  const result = await db.execute(sql`
    SELECT
      cm.channel_id AS "channelId",
      COUNT(m.id)::int AS "unreadCount"
    FROM channel_members cm
    INNER JOIN channels c ON c.id = cm.channel_id
    LEFT JOIN messages m ON
      m.channel_id = cm.channel_id
      AND m.user_id != ${userId}::uuid
      AND cm.last_read_at IS NOT NULL
      AND m.created_at > cm.last_read_at
    WHERE
      cm.user_id = ${userId}::uuid
      AND c.workspace_id = ${workspaceId}::uuid
    GROUP BY cm.channel_id
  `);

  return (result.rows as Array<{ channelId: string; unreadCount: number }>).map((row) => ({
    channelId: row.channelId,
    unreadCount: row.unreadCount,
  }));
}

export async function updateChannelCreator(
  channelId: string,
  newCreatorId: string
): Promise<void> {
  await db
    .update(channels)
    .set({ createdById: newCreatorId })
    .where(eq(channels.id, channelId));
}

export async function findChannelMemberProfiles(
  channelId: string,
  workspaceId: string
): Promise<ChannelMemberProfile[]> {
  const result = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      role: workspaceMembers.role,
    })
    .from(channelMembers)
    .innerJoin(users, eq(channelMembers.userId, users.id))
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.userId, channelMembers.userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .where(eq(channelMembers.channelId, channelId));

  return result;
}
