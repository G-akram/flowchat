import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 80 }).notNull(),
  topic: text('topic'),
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbChannel = typeof channels.$inferSelect;
export type NewDbChannel = typeof channels.$inferInsert;
