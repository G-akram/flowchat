import { eq, and, sql, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../lib/db';
import { channels, type DbChannel } from '../../db/schema/channels';
import { channelMembers } from '../../db/schema/channel-members';
import { users } from '../../db/schema/users';

const memberA = alias(channelMembers, 'member_a');
const memberB = alias(channelMembers, 'member_b');

export async function findExistingDm(
  workspaceId: string,
  userIdA: string,
  userIdB: string
): Promise<DbChannel | undefined> {
  const result = await db
    .select({ channel: channels })
    .from(channels)
    .innerJoin(memberA, eq(memberA.channelId, channels.id))
    .innerJoin(memberB, eq(memberB.channelId, channels.id))
    .where(
      and(
        eq(channels.workspaceId, workspaceId),
        eq(channels.isDirectMessage, true),
        eq(memberA.userId, userIdA),
        eq(memberB.userId, userIdB),
        sql`(SELECT count(*) FROM channel_members WHERE channel_id = ${channels.id}) = 2`
      )
    )
    .limit(1);

  return result[0]?.channel;
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
  const currentUserMember = alias(channelMembers, 'current_user_member');
  const otherUserMember = alias(channelMembers, 'other_user_member');

  const rows = await db
    .select({
      channel: channels,
      otherUser: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(channels)
    .innerJoin(currentUserMember, eq(currentUserMember.channelId, channels.id))
    .innerJoin(
      otherUserMember,
      and(
        eq(otherUserMember.channelId, channels.id),
        ne(otherUserMember.userId, userId)
      )
    )
    .innerJoin(users, eq(users.id, otherUserMember.userId))
    .where(
      and(
        eq(channels.workspaceId, workspaceId),
        eq(channels.isDirectMessage, true),
        eq(currentUserMember.userId, userId)
      )
    );

  return rows;
}
