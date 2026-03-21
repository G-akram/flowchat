import { AppError } from '../../lib/errors';
import type { CreateChannelInput } from './channel.schemas';
import {
  createChannel as createChannelInDb,
  findChannelById,
  findChannelsByUserInWorkspace,
  addChannelMember,
  findChannelMember,
  findWorkspaceMember,
} from './channel.repository';
import type { DbChannel } from '../../db/schema/channels';

interface ChannelResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
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

  const channels = await findChannelsByUserInWorkspace(workspaceId, userId);
  return channels.map(mapChannel);
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
