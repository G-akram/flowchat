import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { workspaces } from './workspaces';

export const channels = pgTable(
  'channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    description: text('description'),
    isPrivate: boolean('is_private').notNull().default(false),
    isDirectMessage: boolean('is_direct_message').notNull().default(false),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdIdx: index('channels_workspace_id_idx').on(t.workspaceId),
    createdByIdIdx: index('channels_created_by_id_idx').on(t.createdById),
    workspaceDmIdx: index('channels_workspace_dm_idx').on(t.workspaceId, t.isDirectMessage),
  })
);

export type DbChannel = typeof channels.$inferSelect;
export type NewDbChannel = typeof channels.$inferInsert;
