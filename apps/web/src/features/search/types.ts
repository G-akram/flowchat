export interface SearchResultMessage {
  id: string;
  channelId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  channel: {
    id: string;
    name: string;
    isDirectMessage: boolean;
  };
}
