import { pgTable, uuid, timestamp, pgEnum, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { workspaces } from './workspaces';

export const workspaceMemberRole = pgEnum('workspace_member_role', ['owner', 'admin', 'member']);

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceMemberRole('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.userId] }),
    workspaceIdIdx: index('workspace_members_workspace_id_idx').on(t.workspaceId),
    userIdIdx: index('workspace_members_user_id_idx').on(t.userId),
  })
);

export type DbWorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewDbWorkspaceMember = typeof workspaceMembers.$inferInsert;
