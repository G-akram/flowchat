export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_HEARTBEAT: 'presence:heartbeat',
  CHANNEL_JOINED: 'channel:joined',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
