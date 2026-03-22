import {
  createNotification as createNotificationInDb,
  findNotificationsByUserId,
  countUnreadByUserId,
  markAsRead as markAsReadInDb,
  markAllAsRead as markAllAsReadInDb,
  deleteNotification as deleteNotificationInDb,
  clearAllNotifications as clearAllInDb,
  type NotificationType,
} from './notification.repository';
import type { DbNotification } from '../../db/schema/notifications';
import { AppError } from '../../lib/errors';

interface NotificationResponse {
  id: string;
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

function mapNotification(n: DbNotification): NotificationResponse {
  return {
    id: n.id,
    userId: n.userId,
    workspaceId: n.workspaceId,
    type: n.type,
    title: n.title,
    body: n.body,
    actionUrl: n.actionUrl,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function create(input: {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
}): Promise<NotificationResponse> {
  const notification = await createNotificationInDb(input);
  return mapNotification(notification);
}

export async function list(userId: string): Promise<NotificationResponse[]> {
  const results = await findNotificationsByUserId(userId);
  return results.map(mapNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return countUnreadByUserId(userId);
}

export async function markRead(
  notificationId: string,
  userId: string
): Promise<NotificationResponse> {
  const updated = await markAsReadInDb(notificationId, userId);

  if (!updated) {
    throw new AppError('NOT_FOUND', 'Notification not found', 404);
  }

  return mapNotification(updated);
}

export async function markAllRead(userId: string): Promise<void> {
  await markAllAsReadInDb(userId);
}

export async function remove(
  notificationId: string,
  userId: string
): Promise<void> {
  await deleteNotificationInDb(notificationId, userId);
}

export async function clearAll(userId: string): Promise<void> {
  await clearAllInDb(userId);
}
