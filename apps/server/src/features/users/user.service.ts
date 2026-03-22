import { AppError } from '../../lib/errors';
import { redis } from '../../lib/redis';
import type { UpdateProfileInput } from './user.schemas';
import {
  findUserById,
  updateUser,
  findWorkspaceMemberUserIds,
  findWorkspaceMember,
  findWorkspaceMemberProfiles,
  type WorkspaceMemberProfile,
} from './user.repository';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface PresenceEntry {
  userId: string;
  status: 'online' | 'away' | 'offline';
}

const PRESENCE_KEY_PREFIX = 'presence:user:';

function toProfile(user: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
}): UserProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  return toProfile(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  const updated = await updateUser(userId, input);

  if (!updated) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  return toProfile(updated);
}

export async function listWorkspaceMembers(
  workspaceId: string,
  requestingUserId: string
): Promise<WorkspaceMemberProfile[]> {
  const member = await findWorkspaceMember(workspaceId, requestingUserId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  return findWorkspaceMemberProfiles(workspaceId);
}

export async function getWorkspacePresence(
  workspaceId: string,
  requestingUserId: string
): Promise<PresenceEntry[]> {
  const member = await findWorkspaceMember(workspaceId, requestingUserId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const memberUserIds = await findWorkspaceMemberUserIds(workspaceId);

  if (memberUserIds.length === 0) {
    return [];
  }

  const keys = memberUserIds.map((id) => `${PRESENCE_KEY_PREFIX}${id}`);
  const values = await redis.mget(...keys);

  return memberUserIds.map((userId, index) => {
    const value = values[index];
    let status: 'online' | 'away' | 'offline' = 'offline';

    if (value === 'online') {
      status = 'online';
    } else if (value === 'away') {
      status = 'away';
    }

    return { userId, status };
  });
}
