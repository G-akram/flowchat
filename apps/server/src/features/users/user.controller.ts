import type { Request, Response, NextFunction } from 'express';
import type { UserParams, UpdateProfileInput, WorkspacePresenceParams } from './user.schemas';
import { getProfile, updateProfile, getWorkspacePresence } from './user.service';
import { AppError } from '../../lib/errors';

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const profile = await getProfile(user.id);

    res.status(200).json({ data: { user: profile } });
  } catch (err) {
    next(err);
  }
}

export async function updateMeHandler(
  req: Request<Record<string, never>, unknown, UpdateProfileInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const profile = await updateProfile(user.id, req.body);

    res.status(200).json({ data: { user: profile } });
  } catch (err) {
    next(err);
  }
}

export async function getUserHandler(
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const profile = await getProfile(req.params.userId);

    res.status(200).json({ data: { user: profile } });
  } catch (err) {
    next(err);
  }
}

export async function getWorkspacePresenceHandler(
  req: Request<WorkspacePresenceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const presence = await getWorkspacePresence(req.params.workspaceId, user.id);

    res.status(200).json({ data: { presence } });
  } catch (err) {
    next(err);
  }
}
