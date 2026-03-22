import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../lib/db';
import { notifications, type DbNotification } from '../../db/schema/notifications';

export type NotificationType =
  | 'channel_invited'
  | 'channel_removed'
  | 'workspace_invited'
  | 'workspace_removed';

export async function createNotification(input: {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
}): Promise<DbNotification> {
  const result = await db.insert(notifications).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to create notification');
  }

  return created;
}

export async function findNotificationsByUserId(
  userId: string,
  limit: number = 50
): Promise<DbNotification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadByUserId(userId: string): Promise<number> {
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return result.length;
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<DbNotification | undefined> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return result[0];
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}

export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function clearAllNotifications(userId: string): Promise<void> {
  await db
    .delete(notifications)
    .where(eq(notifications.userId, userId));
}
