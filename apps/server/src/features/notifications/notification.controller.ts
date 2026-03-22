import type { Request, Response, NextFunction } from 'express';
import type { NotificationParams } from './notification.schemas';
import { list, getUnreadCount, markRead, markAllRead, remove, clearAll } from './notification.service';
import { AppError } from '../../lib/errors';

export async function listNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const notifications = await list(user.id);
    const unreadCount = await getUnreadCount(user.id);

    res.status(200).json({ data: { notifications, unreadCount } });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationReadHandler(
  req: Request<NotificationParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const notification = await markRead(req.params.notificationId, user.id);

    res.status(200).json({ data: { notification } });
  } catch (err) {
    next(err);
  }
}

export async function markAllReadHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await markAllRead(user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function deleteNotificationHandler(
  req: Request<NotificationParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await remove(req.params.notificationId, user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function clearAllNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await clearAll(user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
