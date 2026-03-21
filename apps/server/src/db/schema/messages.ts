import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { channels } from './channels';
import { users } from './users';

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    content: text('content').notNull(),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('messages_channel_id_idx').on(t.channelId),
    index('messages_user_id_idx').on(t.userId),
    index('messages_created_at_idx').on(t.createdAt),
  ]
);

export type DbMessage = typeof messages.$inferSelect;
export type NewDbMessage = typeof messages.$inferInsert;
