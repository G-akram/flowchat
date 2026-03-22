import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 64 }).notNull(),
    slug: varchar('slug', { length: 32 }).notNull().unique(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdIdx: index('workspaces_owner_id_idx').on(t.ownerId),
  })
);

export type DbWorkspace = typeof workspaces.$inferSelect;
export type NewDbWorkspace = typeof workspaces.$inferInsert;
