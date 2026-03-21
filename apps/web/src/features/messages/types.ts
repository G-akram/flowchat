export interface MessageUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MessageWithUser {
  id: string;
  channelId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  user: MessageUser;
}

export interface OptimisticMessage extends MessageWithUser {
  tempId: string;
  status: 'sending' | 'failed';
}

export type DisplayMessage = MessageWithUser | OptimisticMessage;

export function isOptimisticMessage(msg: DisplayMessage): msg is OptimisticMessage {
  return 'tempId' in msg;
}
