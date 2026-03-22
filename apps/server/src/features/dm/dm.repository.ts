import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { channels, type DbChannel } from '../../db/schema/channels';
import { channelMembers } from '../../db/schema/channel-members';
import { users } from '../../db/schema/users';

export async function findExistingDm(
  workspaceId: string,
  userIdA: string,
  userIdB: string
): Promise<DbChannel | undefined> {
  const result = await db
    .select({ channel: channels })
    .from(channels)
    .innerJoin(channelMembers, eq(channelMembers.channelId, channels.id))
    .where(
      and(
        eq(channels.workspaceId, workspaceId),
        eq(channels.isDirectMessage, true),
        eq(channelMembers.userId, userIdA)
      )
    );

  for (const row of result) {
    const members = await db
      .select({ userId: channelMembers.userId })
      .from(channelMembers)
      .where(eq(channelMembers.channelId, row.channel.id));

    const memberIds = members.map((m) => m.userId);
    if (memberIds.length === 2 && memberIds.includes(userIdB)) {
      return row.channel;
    }
  }

  return undefined;
}

export async function createDmChannel(input: {
  workspaceId: string;
  createdById: string;
  name: string;
}): Promise<DbChannel> {
  const result = await db
    .insert(channels)
    .values({
      workspaceId: input.workspaceId,
      name: input.name,
      isPrivate: true,
      isDirectMessage: true,
      createdById: input.createdById,
    })
    .returning();

  const created = result[0];

  if (!created) {
    throw new Error('Failed to create DM channel');
  }

  return created;
}

export interface DmChannelWithOtherUser {
  channel: DbChannel;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export async function findDmsByUserInWorkspace(
  workspaceId: string,
  userId: string
): Promise<DmChannelWithOtherUser[]> {
  const dmChannels = await db
    .select({ channel: channels })
    .from(channelMembers)
    .innerJoin(channels, eq(channelMembers.channelId, channels.id))
    .where(
      and(
        eq(channels.workspaceId, workspaceId),
        eq(channels.isDirectMessage, true),
        eq(channelMembers.userId, userId)
      )
    );

  const results: DmChannelWithOtherUser[] = [];

  for (const row of dmChannels) {
    const otherMember = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(channelMembers)
      .innerJoin(users, eq(channelMembers.userId, users.id))
      .where(
        and(
          eq(channelMembers.channelId, row.channel.id),
          sql`${channelMembers.userId} != ${userId}`
        )
      )
      .limit(1);

    const other = otherMember[0];
    if (other) {
      results.push({ channel: row.channel, otherUser: other });
    }
  }

  return results;
}
