import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';

interface TypingPayload {
  channelId: string;
  userId: string;
  displayName: string;
}

export function registerTypingHandler(socket: Socket, userId: string): void {
  socket.on(SOCKET_EVENTS.TYPING_START, (data: unknown) => {
    if (typeof data !== 'object' || data === null) return;

    const payload = data as Record<string, unknown>;
    const channelId = payload['channelId'];

    if (typeof channelId !== 'string') return;

    const typingData: TypingPayload = {
      channelId,
      userId,
      displayName: typeof payload['displayName'] === 'string' ? payload['displayName'] : '',
    };

    socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.TYPING_START, typingData);
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (data: unknown) => {
    if (typeof data !== 'object' || data === null) return;

    const payload = data as Record<string, unknown>;
    const channelId = payload['channelId'];

    if (typeof channelId !== 'string') return;

    const typingData: TypingPayload = {
      channelId,
      userId,
      displayName: typeof payload['displayName'] === 'string' ? payload['displayName'] : '',
    };

    socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.TYPING_STOP, typingData);
  });
}
