import type { Socket } from 'socket.io';
import { logger } from '../../lib/logger';

export function registerMessageHandler(socket: Socket, userId: string): void {
  socket.on('channel:join', (channelId: unknown) => {
    if (typeof channelId !== 'string') return;

    const room = `channel:${channelId}`;
    void socket.join(room);
    logger.debug({ userId, channelId, socketId: socket.id }, 'Joined channel room');
  });

  socket.on('channel:leave', (channelId: unknown) => {
    if (typeof channelId !== 'string') return;

    const room = `channel:${channelId}`;
    void socket.leave(room);
    logger.debug({ userId, channelId, socketId: socket.id }, 'Left channel room');
  });
}
