import type { Request, Response, NextFunction } from 'express';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceParams, MemberParams, InviteMemberInput } from './workspace.schemas';
import { create, listByUser, getById, inviteMember, update, remove, leave, kickMember } from './workspace.service';
import { AppError } from '../../lib/errors';

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

    await leave(req.params.workspaceId, user.id);

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

    await kickMember(req.params.workspaceId, req.params.userId, user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
