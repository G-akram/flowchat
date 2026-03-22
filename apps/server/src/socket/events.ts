export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_HEARTBEAT: 'presence:heartbeat',
  CHANNEL_JOINED: 'channel:joined',
  WORKSPACE_MEMBER_ADDED: 'workspace:member:added',
  WORKSPACE_MEMBER_REMOVED: 'workspace:member:removed',
  CHANNEL_MEMBER_ADDED: 'channel:member:added',
  CHANNEL_MEMBER_REMOVED: 'channel:member:removed',
  CHANNEL_UPDATED: 'channel:updated',
  CHANNEL_DELETED: 'channel:deleted',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
