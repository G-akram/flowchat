import type { Request, Response, NextFunction } from 'express';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceParams, MemberParams, InviteMemberInput } from './workspace.schemas';
import { create, listByUser, getById, inviteMember, update, remove, leave, kickMember } from './workspace.service';
import { findWorkspaceById } from './workspace.repository';
import { create as createNotification } from '../notifications/notification.service';
import { AppError } from '../../lib/errors';
import { getIO } from '../../socket/socket.server';
import { emitToUser } from '../../socket/emit-to-user';
import { SOCKET_EVENTS } from '../../socket/events';

export async function createWorkspaceHandler(
  req: Request<Record<string, never>, unknown, CreateWorkspaceInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const workspace = await create(req.body, user.id);

    res.status(201).json({ data: { workspace } });
  } catch (err) {
    next(err);
  }
}

export async function listWorkspacesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const workspaces = await listByUser(user.id);

    res.status(200).json({ data: { workspaces } });
  } catch (err) {
    next(err);
  }
}

export async function getWorkspaceHandler(
  req: Request<WorkspaceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const workspace = await getById(req.params.workspaceId, user.id);

    res.status(200).json({ data: { workspace } });
  } catch (err) {
    next(err);
  }
}

export async function inviteMemberHandler(
  req: Request<WorkspaceParams, unknown, InviteMemberInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const member = await inviteMember(req.params.workspaceId, req.body, user.id);

    const workspace = await findWorkspaceById(req.params.workspaceId);
    const workspaceName = workspace?.name ?? 'this workspace';

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.WORKSPACE_MEMBER_ADDED, {
      workspaceId: req.params.workspaceId,
      workspaceName,
      userId: member.userId,
      role: member.role,
    });

    const notification = await createNotification({
      userId: member.userId,
      workspaceId: req.params.workspaceId,
      type: 'workspace_invited',
      title: `Added to ${workspaceName}`,
      body: `${user.displayName} added you to ${workspaceName}`,
      actionUrl: `/app/${req.params.workspaceId}`,
    });

    emitToUser(member.userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

    res.status(201).json({ data: { member } });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkspaceHandler(
  req: Request<WorkspaceParams, unknown, UpdateWorkspaceInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const workspace = await update(req.params.workspaceId, req.body, user.id);

    res.status(200).json({ data: { workspace } });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkspaceHandler(
  req: Request<WorkspaceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await remove(req.params.workspaceId, user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function leaveWorkspaceHandler(
  req: Request<WorkspaceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const leavingWorkspace = await findWorkspaceById(req.params.workspaceId);

    await leave(req.params.workspaceId, user.id);

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.WORKSPACE_MEMBER_REMOVED, {
      workspaceId: req.params.workspaceId,
      workspaceName: leavingWorkspace?.name,
      userId: user.id,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function kickMemberHandler(
  req: Request<MemberParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const kickWorkspace = await findWorkspaceById(req.params.workspaceId);
    const kickWsName = kickWorkspace?.name ?? 'this workspace';

    await kickMember(req.params.workspaceId, req.params.userId, user.id);

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.WORKSPACE_MEMBER_REMOVED, {
      workspaceId: req.params.workspaceId,
      workspaceName: kickWsName,
      userId: req.params.userId,
    });

    const notification = await createNotification({
      userId: req.params.userId,
      workspaceId: req.params.workspaceId,
      type: 'workspace_removed',
      title: `Removed from ${kickWsName}`,
      body: `You were removed from ${kickWsName}`,
    });

    emitToUser(req.params.userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
