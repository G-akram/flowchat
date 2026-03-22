import { AppError } from '../../lib/errors';
import { findWorkspaceMember, addChannelMember } from '../channels/channel.repository';
import {
  findExistingDm,
  createDmChannel,
  findDmsByUserInWorkspace,
  type DmChannelWithOtherUser,
} from './dm.repository';


interface DmOtherUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface DmResponse {
  id: string;
  workspaceId: string;
  isDirectMessage: true;
  otherUser: DmOtherUser;
  createdAt: string;
}

function mapDm(row: DmChannelWithOtherUser): DmResponse {
  return {
    id: row.channel.id,
    workspaceId: row.channel.workspaceId,
    isDirectMessage: true,
    otherUser: row.otherUser,
    createdAt: row.channel.createdAt.toISOString(),
  };
}

async function ensureWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }
}

export async function openDm(
  workspaceId: string,
  currentUserId: string,
  targetUserId: string
): Promise<DmResponse> {
  await ensureWorkspaceMember(workspaceId, currentUserId);

  if (currentUserId === targetUserId) {
    throw new AppError('VALIDATION_ERROR', 'Cannot open a DM with yourself', 400);
  }

  await ensureWorkspaceMember(workspaceId, targetUserId);

  const existing = await findExistingDm(workspaceId, currentUserId, targetUserId);

  if (existing) {
    const dms = await findDmsByUserInWorkspace(workspaceId, currentUserId);
    const match = dms.find((d) => d.channel.id === existing.id);

    if (!match) {
      throw new AppError('INTERNAL_ERROR', 'Failed to resolve DM', 500);
    }

    return mapDm(match);
  }

  const dmName = `dm-${currentUserId}-${targetUserId}`;
  const channel = await createDmChannel({
    workspaceId,
    createdById: currentUserId,
    name: dmName,
  });

  await addChannelMember({ channelId: channel.id, userId: currentUserId });
  await addChannelMember({ channelId: channel.id, userId: targetUserId });

  const dms = await findDmsByUserInWorkspace(workspaceId, currentUserId);
  const created = dms.find((d) => d.channel.id === channel.id);

  if (!created) {
    throw new AppError('INTERNAL_ERROR', 'Failed to resolve DM', 500);
  }

  return mapDm(created);
}

export async function listDms(
  workspaceId: string,
  userId: string
): Promise<DmResponse[]> {
  await ensureWorkspaceMember(workspaceId, userId);

  const dms = await findDmsByUserInWorkspace(workspaceId, userId);
  return dms.map(mapDm);
}
