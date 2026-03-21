import type { Server as SocketServer, Socket } from 'socket.io';
import { redis } from '../../lib/redis';
import { SOCKET_EVENTS } from '../events';
import { logger } from '../../lib/logger';

const PRESENCE_TTL_SECONDS = 70;
const PRESENCE_KEY_PREFIX = 'presence:user:';

function userPresenceKey(userId: string): string {
  return `${PRESENCE_KEY_PREFIX}${userId}`;
}

type PresenceStatus = 'online' | 'away';

async function setPresence(userId: string, status: PresenceStatus): Promise<void> {
  await redis.setex(userPresenceKey(userId), PRESENCE_TTL_SECONDS, status);
}

async function setOffline(userId: string): Promise<void> {
  await redis.del(userPresenceKey(userId));
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

    await setPresence(userId, 'online');

    io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
      userId,
      status: 'online',
    });

    logger.debug({ userId, workspaceId }, 'User joined workspace presence');
  });

  socket.on(SOCKET_EVENTS.PRESENCE_HEARTBEAT, async (data: unknown) => {
    const status: PresenceStatus =
      typeof data === 'object' && data !== null && 'status' in data &&
      (data as Record<string, unknown>)['status'] === 'away'
        ? 'away'
        : 'online';

    await setPresence(userId, status);

    const rooms = Array.from(socket.rooms);

    for (const room of rooms) {
      if (room.startsWith('workspace:')) {
        socket.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          userId,
          status,
        });
      }
    }

    logger.debug({ userId }, 'Presence heartbeat received');
  });

  socket.on('workspace:leave', async (workspaceId: unknown) => {
    if (typeof workspaceId !== 'string') return;

    await handleWorkspaceLeave(io, socket, userId, workspaceId);
  });

  socket.on('disconnect', async () => {
    await setOffline(userId);

    const rooms = Array.from(socket.rooms);

    for (const room of rooms) {
      if (room.startsWith('workspace:')) {
        io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          userId,
          status: 'offline',
        });
      }
    }

    logger.debug({ userId }, 'User disconnected, presence cleared');
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

  const remainingWorkspaceRooms = Array.from(socket.rooms).filter((r) =>
    r.startsWith('workspace:')
  );

  if (remainingWorkspaceRooms.length === 0) {
    await setOffline(userId);
  }

  io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    userId,
    status: remainingWorkspaceRooms.length === 0 ? 'offline' : 'online',
  });

  logger.debug({ userId, workspaceId }, 'User left workspace presence');
}
