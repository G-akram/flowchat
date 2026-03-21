import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { channels } from './channels';
import { users } from './users';

export const channelMembers = pgTable(
  'channel_members',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.channelId, t.userId] }),
    index('channel_members_channel_id_idx').on(t.channelId),
    index('channel_members_user_id_idx').on(t.userId),
  ]
);

export type DbChannelMember = typeof channelMembers.$inferSelect;
export type NewDbChannelMember = typeof channelMembers.$inferInsert;
