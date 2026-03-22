import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { channels } from './channels';
import { messages } from './messages';
import { workspaceMembers } from './workspace-members';
import { channelMembers } from './channel-members';
import { messageAttachments } from './message-attachments';
import { reactions } from './reactions';
import { refreshTokens } from './refresh-tokens';
import { notifications } from './notifications';

// ─── Table exports ────────────────────────────────────────────────────────────

export { users } from './users';
export { workspaces } from './workspaces';
export { channels } from './channels';
export { messages } from './messages';
export { workspaceMembers, workspaceMemberRole } from './workspace-members';
export { channelMembers } from './channel-members';
export { messageAttachments } from './message-attachments';
export { reactions } from './reactions';
export { refreshTokens } from './refresh-tokens';
export { notifications, notificationTypeEnum } from './notifications';

// ─── Type exports ─────────────────────────────────────────────────────────────

export type { DbUser, NewDbUser } from './users';
export type { DbWorkspace, NewDbWorkspace } from './workspaces';
export type { DbChannel, NewDbChannel } from './channels';
export type { DbMessage, NewDbMessage } from './messages';
export type { DbWorkspaceMember, NewDbWorkspaceMember } from './workspace-members';
export type { DbChannelMember, NewDbChannelMember } from './channel-members';
export type { DbMessageAttachment, NewDbMessageAttachment } from './message-attachments';
export type { DbReaction, NewDbReaction } from './reactions';
export type { DbRefreshToken, NewDbRefreshToken } from './refresh-tokens';
export type { DbNotification, NewDbNotification } from './notifications';

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  ownedWorkspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  channelMembers: many(channelMembers),
  messages: many(messages),
  reactions: many(reactions),
  refreshTokens: many(refreshTokens),
  createdChannels: many(channels),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  channels: many(channels),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [channels.workspaceId], references: [workspaces.id] }),
  createdBy: one(users, { fields: [channels.createdById], references: [users.id] }),
  members: many(channelMembers),
  messages: many(messages),
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, { fields: [channelMembers.channelId], references: [channels.id] }),
  user: one(users, { fields: [channelMembers.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  channel: one(channels, { fields: [messages.channelId], references: [channels.id] }),
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  attachments: many(messageAttachments),
  reactions: many(reactions),
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
  message: one(messages, {
    fields: [messageAttachments.messageId],
    references: [messages.id],
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  message: one(messages, { fields: [reactions.messageId], references: [messages.id] }),
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
}));
