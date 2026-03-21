import { AppError } from '../../lib/errors';
import type { CreateWorkspaceInput, InviteMemberInput } from './workspace.schemas';
import {
  createWorkspace as createWorkspaceInDb,
  findWorkspaceById,
  findWorkspaceBySlug,
  findWorkspacesByUserId,
  addWorkspaceMember,
  findWorkspaceMember,
  findUserByEmail,
  createChannel,
  addChannelMember,
} from './workspace.repository';
import type { DbWorkspace } from '../../db/schema/workspaces';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;

  while (await findWorkspaceBySlug(slug)) {
    attempt += 1;
    const suffix = `-${attempt}`;
    slug = baseSlug.slice(0, 32 - suffix.length) + suffix;
  }

  return slug;
}

interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

function mapWorkspace(ws: DbWorkspace): WorkspaceResponse {
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    ownerId: ws.ownerId,
    createdAt: ws.createdAt.toISOString(),
  };
}

export async function create(
  input: CreateWorkspaceInput,
  userId: string
): Promise<WorkspaceResponse> {
  const slug = await generateUniqueSlug(input.name);

  const workspace = await createWorkspaceInDb({
    name: input.name,
    slug,
    ownerId: userId,
  });

  await addWorkspaceMember({
    workspaceId: workspace.id,
    userId,
    role: 'owner',
  });

  const generalChannel = await createChannel({
    workspaceId: workspace.id,
    name: 'general',
    createdById: userId,
  });

  await addChannelMember({
    channelId: generalChannel.id,
    userId,
  });

  return mapWorkspace(workspace);
}

export async function listByUser(userId: string): Promise<WorkspaceResponse[]> {
  const workspaces = await findWorkspacesByUserId(userId);
  return workspaces.map(mapWorkspace);
}

export async function getById(
  workspaceId: string,
  userId: string
): Promise<WorkspaceResponse> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  }

  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    throw new AppError('FORBIDDEN', 'You are not a member of this workspace', 403);
  }

  return mapWorkspace(workspace);
}

export async function inviteMember(
  workspaceId: string,
  input: InviteMemberInput,
  userId: string
): Promise<{ userId: string; role: string }> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  }

  const inviterMember = await findWorkspaceMember(workspaceId, userId);

  if (!inviterMember) {
    throw new AppError('FORBIDDEN', 'You are not a member of this workspace', 403);
  }

  const invitee = await findUserByEmail(input.email.toLowerCase());

  if (!invitee) {
    throw new AppError('USER_NOT_FOUND', 'No user found with that email', 404);
  }

  const existingMember = await findWorkspaceMember(workspaceId, invitee.id);

  if (existingMember) {
    throw new AppError('ALREADY_A_MEMBER', 'User is already a member of this workspace', 409);
  }

  const member = await addWorkspaceMember({
    workspaceId,
    userId: invitee.id,
    role: 'member',
  });

  return { userId: member.userId, role: member.role };
}
