export interface Notification {
  id: string;
  userId: string;
  workspaceId: string;
  type: 'channel_invited' | 'channel_removed' | 'workspace_invited' | 'workspace_removed';
  title: string;
  body: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}
