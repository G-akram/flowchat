import { pgTable, uuid, varchar, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { messages } from './messages';
import { users } from './users';

export const reactions = pgTable(
  'reactions',
  {
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emoji: varchar('emoji', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.messageId, t.userId, t.emoji] }),
    messageIdIdx: index('reactions_message_id_idx').on(t.messageId),
  })
);

export type DbReaction = typeof reactions.$inferSelect;
export type NewDbReaction = typeof reactions.$inferInsert;
