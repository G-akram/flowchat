import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { workspaces } from './workspaces';

export const notificationTypeEnum = pgEnum('notification_type', [
  'channel_invited',
  'channel_removed',
  'workspace_invited',
  'workspace_removed',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body'),
    actionUrl: text('action_url'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index('notifications_user_id_idx').on(t.userId),
    userCreatedIdx: index('notifications_user_created_idx').on(t.userId, t.createdAt),
    userIsReadIdx: index('notifications_user_is_read_idx').on(t.userId, t.isRead),
  })
);

export type DbNotification = typeof notifications.$inferSelect;
export type NewDbNotification = typeof notifications.$inferInsert;
