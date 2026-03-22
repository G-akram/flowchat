import { AppError } from '../../lib/errors';
import type { CreateChannelInput, UpdateChannelInput, AddChannelMemberInput } from './channel.schemas';
import {
  createChannel as createChannelInDb,
  findChannelById,
  findChannelsByUserInWorkspace,
  addChannelMember,
  findChannelMember,
  findWorkspaceMember,
  updateChannel as updateChannelInDb,
  deleteChannel as deleteChannelInDb,
  removeChannelMember,
  findChannelMemberProfiles,
  type ChannelMemberProfile,
} from './channel.repository';
import type { DbChannel } from '../../db/schema/channels';

interface ChannelResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isDirectMessage: boolean;
  createdById: string;
  createdAt: string;
}

function mapChannel(ch: DbChannel): ChannelResponse {
  return {
    id: ch.id,
    workspaceId: ch.workspaceId,
    name: ch.name,
    description: ch.description,
    isPrivate: ch.isPrivate,
    isDirectMessage: ch.isDirectMessage,
    createdById: ch.createdById,
    createdAt: ch.createdAt.toISOString(),
  };
}

async function ensureWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }
}

export async function create(
  workspaceId: string,
  input: CreateChannelInput,
  userId: string
): Promise<ChannelResponse> {
  await ensureWorkspaceMember(workspaceId, userId);

  const channel = await createChannelInDb({
    workspaceId,
    name: input.name,
    ...(input.description !== undefined ? { description: input.description } : {}),
    isPrivate: input.isPrivate,
    createdById: userId,
  });

  await addChannelMember({
    channelId: channel.id,
    userId,
  });

  return mapChannel(channel);
}

export async function listByWorkspace(
  workspaceId: string,
  userId: string
): Promise<ChannelResponse[]> {
  await ensureWorkspaceMember(workspaceId, userId);

  const allChannels = await findChannelsByUserInWorkspace(workspaceId, userId);
  return allChannels.filter((ch) => !ch.isDirectMessage).map(mapChannel);
}

export async function join(
  workspaceId: string,
  channelId: string,
  userId: string
): Promise<ChannelResponse> {
  await ensureWorkspaceMember(workspaceId, userId);

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  const existingMember = await findChannelMember(channelId, userId);

  if (existingMember) {
    throw new AppError('ALREADY_A_MEMBER', 'You are already a member of this channel', 409);
  }

  await addChannelMember({ channelId, userId });

  return mapChannel(channel);
}

export async function getById(
  workspaceId: string,
  channelId: string,
  userId: string
): Promise<ChannelResponse> {
  await ensureWorkspaceMember(workspaceId, userId);

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  const member = await findChannelMember(channelId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this channel', 403);
  }

  return mapChannel(channel);
}

function canManageChannel(
  workspaceRole: string,
  channelCreatedById: string,
  userId: string
): boolean {
  return workspaceRole === 'owner' || workspaceRole === 'admin' || channelCreatedById === userId;
}

export async function update(
  workspaceId: string,
  channelId: string,
  input: UpdateChannelInput,
  userId: string
): Promise<ChannelResponse> {
  const wsMember = await findWorkspaceMember(workspaceId, userId);

  if (!wsMember) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  if (!canManageChannel(wsMember.role, channel.createdById, userId)) {
    throw new AppError('FORBIDDEN', 'You do not have permission to update this channel', 403);
  }

  const updateData: { name?: string; description?: string | null } = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;

  const updated = await updateChannelInDb(channelId, updateData);

  if (!updated) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  return mapChannel(updated);
}

export async function remove(
  workspaceId: string,
  channelId: string,
  userId: string
): Promise<void> {
  const wsMember = await findWorkspaceMember(workspaceId, userId);

  if (!wsMember) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  if (channel.name === 'general') {
    throw new AppError('CANNOT_DELETE', 'The #general channel cannot be deleted', 400);
  }

  if (!canManageChannel(wsMember.role, channel.createdById, userId)) {
    throw new AppError('FORBIDDEN', 'You do not have permission to delete this channel', 403);
  }

  await deleteChannelInDb(channelId);
}

export async function leave(
  workspaceId: string,
  channelId: string,
  userId: string
): Promise<void> {
  const wsMember = await findWorkspaceMember(workspaceId, userId);

  if (!wsMember) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  if (channel.name === 'general') {
    throw new AppError('CANNOT_LEAVE', 'You cannot leave the #general channel', 400);
  }

  const member = await findChannelMember(channelId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this channel', 403);
  }

  await removeChannelMember(channelId, userId);
}

export async function addMember(
  workspaceId: string,
  channelId: string,
  input: AddChannelMemberInput,
  userId: string
): Promise<void> {
  const wsMember = await findWorkspaceMember(workspaceId, userId);

  if (!wsMember) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  const targetWsMember = await findWorkspaceMember(workspaceId, input.userId);

  if (!targetWsMember) {
    throw new AppError('NOT_A_MEMBER', 'User is not a member of this workspace', 400);
  }

  const existing = await findChannelMember(channelId, input.userId);

  if (existing) {
    throw new AppError('ALREADY_A_MEMBER', 'User is already a member of this channel', 409);
  }

  await addChannelMember({ channelId, userId: input.userId });
}

export async function listMembers(
  workspaceId: string,
  channelId: string,
  userId: string
): Promise<ChannelMemberProfile[]> {
  const wsMember = await findWorkspaceMember(workspaceId, userId);

  if (!wsMember) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  return findChannelMemberProfiles(channelId);
}

export async function kickMember(
  workspaceId: string,
  channelId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  const wsMember = await findWorkspaceMember(workspaceId, requestingUserId);

  if (!wsMember) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const channel = await findChannelById(channelId);

  if (!channel || channel.workspaceId !== workspaceId) {
    throw new AppError('CHANNEL_NOT_FOUND', 'Channel not found', 404);
  }

  if (channel.name === 'general') {
    throw new AppError('FORBIDDEN', 'Cannot remove members from the #general channel', 403);
  }

  if (!canManageChannel(wsMember.role, channel.createdById, requestingUserId)) {
    throw new AppError('FORBIDDEN', 'You do not have permission to remove members from this channel', 403);
  }

  const member = await findChannelMember(channelId, targetUserId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'User is not a member of this channel', 404);
  }

  await removeChannelMember(channelId, targetUserId);
}
