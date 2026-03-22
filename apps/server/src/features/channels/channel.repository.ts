import { eq, and } from 'drizzle-orm';
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
