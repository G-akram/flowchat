import type { Request, Response, NextFunction } from 'express';
import type { DmWorkspaceParams, OpenDmInput } from './dm.schemas';
import { openDm, listDms } from './dm.service';
import { AppError } from '../../lib/errors';

export async function openDmHandler(
  req: Request<DmWorkspaceParams, unknown, OpenDmInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const dm = await openDm(req.params.workspaceId, user.id, req.body.userId);

    res.status(200).json({ data: { dm } });
  } catch (err) {
    next(err);
  }
}

export async function listDmsHandler(
  req: Request<DmWorkspaceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const dms = await listDms(req.params.workspaceId, user.id);

    res.status(200).json({ data: { dms } });
  } catch (err) {
    next(err);
  }
}
