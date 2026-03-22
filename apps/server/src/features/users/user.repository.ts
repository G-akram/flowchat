import { eq, and } from 'drizzle-orm';
import { db } from '../../lib/db';
import { users, type DbUser } from '../../db/schema/users';
import { workspaceMembers } from '../../db/schema/workspace-members';

export async function findUserById(id: string): Promise<DbUser | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(
  id: string,
  input: { displayName?: string | undefined; avatarUrl?: string | null | undefined }
): Promise<DbUser | undefined> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.displayName !== undefined) {
    updateData['displayName'] = input.displayName;
  }

  if (input.avatarUrl !== undefined) {
    updateData['avatarUrl'] = input.avatarUrl;
  }

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function findWorkspaceMemberUserIds(workspaceId: string): Promise<string[]> {
  const result = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return result.map((r) => r.userId);
}

export interface WorkspaceMemberProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export async function findWorkspaceMemberProfiles(
  workspaceId: string
): Promise<WorkspaceMemberProfile[]> {
  const result = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return result;
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
