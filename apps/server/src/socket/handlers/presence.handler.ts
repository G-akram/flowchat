import type { Server as SocketServer, Socket } from 'socket.io';
import { redis } from '../../lib/redis';
import { SOCKET_EVENTS } from '../events';
import { logger } from '../../lib/logger';

const PRESENCE_TTL_SECONDS = 300;

function workspaceKey(workspaceId: string): string {
  return `presence:${workspaceId}`;
}

export function registerPresenceHandler(
  io: SocketServer,
  socket: Socket,
  userId: string
): void {
  socket.on('workspace:join', async (workspaceId: unknown) => {
    if (typeof workspaceId !== 'string') return;

    const room = `workspace:${workspaceId}`;
    socket.join(room);

    const key = workspaceKey(workspaceId);
    await redis.sadd(key, userId);
    await redis.expire(key, PRESENCE_TTL_SECONDS);

    const onlineUsers = await redis.smembers(key);

    io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
      workspaceId,
      onlineUsers,
    });

    logger.debug({ userId, workspaceId }, 'User joined workspace presence');
  });

  socket.on('workspace:leave', async (workspaceId: unknown) => {
    if (typeof workspaceId !== 'string') return;

    await handleWorkspaceLeave(io, socket, userId, workspaceId);
  });

  socket.on('disconnect', async () => {
    const rooms = Array.from(socket.rooms);

    for (const room of rooms) {
      if (room.startsWith('workspace:')) {
        const workspaceId = room.slice('workspace:'.length);
        await handleWorkspaceLeave(io, socket, userId, workspaceId);
      }
    }
  });
}

async function handleWorkspaceLeave(
  io: SocketServer,
  socket: Socket,
  userId: string,
  workspaceId: string
): Promise<void> {
  const room = `workspace:${workspaceId}`;
  socket.leave(room);

  const key = workspaceKey(workspaceId);
  await redis.srem(key, userId);

  const onlineUsers = await redis.smembers(key);

  io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    workspaceId,
    onlineUsers,
  });

  logger.debug({ userId, workspaceId }, 'User left workspace presence');
}
