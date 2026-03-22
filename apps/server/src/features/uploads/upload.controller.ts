import type { Request, Response, NextFunction } from 'express';
import type { PresignUploadInput, ConfirmUploadInput } from './upload.schemas';
import { presign, confirmUpload } from './upload.service';
import { AppError } from '../../lib/errors';

export async function presignUploadHandler(
  req: Request<unknown, unknown, PresignUploadInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const result = await presign(req.body);

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function confirmUploadHandler(
  req: Request<unknown, unknown, ConfirmUploadInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await confirmUpload(req.body, user.id);

    res.status(201).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}
