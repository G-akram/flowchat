export interface DmOtherUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface DirectMessage {
  id: string;
  workspaceId: string;
  isDirectMessage: true;
  otherUser: DmOtherUser;
  createdAt: string;
}
