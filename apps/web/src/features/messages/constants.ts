export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  WORKSPACE_MEMBER_ADDED: 'workspace:member:added',
  WORKSPACE_MEMBER_REMOVED: 'workspace:member:removed',
  CHANNEL_MEMBER_ADDED: 'channel:member:added',
  CHANNEL_MEMBER_REMOVED: 'channel:member:removed',
  CHANNEL_UPDATED: 'channel:updated',
  CHANNEL_DELETED: 'channel:deleted',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const MESSAGES_QUERY_KEY = 'messages';
export const DEFAULT_MESSAGE_LIMIT = 50;
export const TYPING_TIMEOUT_MS = 3000;
export const TYPING_DEBOUNCE_MS = 500;
