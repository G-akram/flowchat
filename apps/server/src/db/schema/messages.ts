import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { channels } from './channels';
import { users } from './users';

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbMessage = typeof messages.$inferSelect;
export type NewDbMessage = typeof messages.$inferInsert;
