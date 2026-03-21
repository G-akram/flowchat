import { eq, and } from 'drizzle-orm';
import { db } from '../../lib/db';
import { channels, type DbChannel } from '../../db/schema/channels';
import { channelMembers, type DbChannelMember } from '../../db/schema/channel-members';
import { workspaceMembers } from '../../db/schema/workspace-members';

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

export async function findWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<{ workspaceId: string; userId: string } | undefined> {
  const result = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
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
