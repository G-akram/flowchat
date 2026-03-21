import { eq, and } from 'drizzle-orm';
import { db } from '../../lib/db';
import { workspaces, type DbWorkspace } from '../../db/schema/workspaces';
import { workspaceMembers, type DbWorkspaceMember } from '../../db/schema/workspace-members';
import { channels, type DbChannel } from '../../db/schema/channels';
import { channelMembers } from '../../db/schema/channel-members';
import { users } from '../../db/schema/users';

export async function createWorkspace(input: {
  name: string;
  slug: string;
  ownerId: string;
}): Promise<DbWorkspace> {
  const result = await db.insert(workspaces).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to create workspace');
  }

  return created;
}

export async function findWorkspaceById(id: string): Promise<DbWorkspace | undefined> {
  const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return result[0];
}

export async function findWorkspaceBySlug(slug: string): Promise<DbWorkspace | undefined> {
  const result = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  return result[0];
}

export async function findWorkspacesByUserId(userId: string): Promise<DbWorkspace[]> {
  const result = await db
    .select({ workspace: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));

  return result.map((r) => r.workspace);
}

export async function addWorkspaceMember(input: {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
}): Promise<DbWorkspaceMember> {
  const result = await db.insert(workspaceMembers).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to add workspace member');
  }

  return created;
}

export async function findWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<DbWorkspaceMember | undefined> {
  const result = await db
    .select()
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

export async function findUserByEmail(email: string): Promise<{ id: string } | undefined> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0];
}

export async function createChannel(input: {
  workspaceId: string;
  name: string;
  createdById: string;
}): Promise<DbChannel> {
  const result = await db.insert(channels).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to create channel');
  }

  return created;
}

export async function addChannelMember(input: {
  channelId: string;
  userId: string;
}): Promise<void> {
  await db.insert(channelMembers).values(input);
}
