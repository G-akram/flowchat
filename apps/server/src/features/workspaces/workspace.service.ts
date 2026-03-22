import { AppError } from '../../lib/errors';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, InviteMemberInput } from './workspace.schemas';
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
  updateWorkspace as updateWorkspaceInDb,
  deleteWorkspace as deleteWorkspaceInDb,
  removeWorkspaceMember,
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

export async function update(
  workspaceId: string,
  input: UpdateWorkspaceInput,
  userId: string
): Promise<WorkspaceResponse> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  }

  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new AppError('FORBIDDEN', 'Only owners and admins can update workspaces', 403);
  }

  const slug = await generateUniqueSlug(input.name);

  const updated = await updateWorkspaceInDb(workspaceId, { name: input.name, slug });

  if (!updated) {
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  }

  return mapWorkspace(updated);
}

export async function remove(
  workspaceId: string,
  userId: string
): Promise<void> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  }

  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member || member.role !== 'owner') {
    throw new AppError('FORBIDDEN', 'Only the workspace owner can delete it', 403);
  }

  await deleteWorkspaceInDb(workspaceId);
}

export async function leave(
  workspaceId: string,
  userId: string
): Promise<void> {
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found', 404);
  }

  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  if (member.role === 'owner') {
    throw new AppError('CANNOT_LEAVE', 'Workspace owner cannot leave. Transfer ownership or delete the workspace.', 400);
  }

  await removeWorkspaceMember(workspaceId, userId);
}
