import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { registerMessageHandler } from './handlers/message.handler';
import { registerTypingHandler } from './handlers/typing.handler';
import { registerPresenceHandler } from './handlers/presence.handler';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

let io: SocketServer | null = null;

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as unknown;

    if (typeof token !== 'string') {
      next(new Error('Authentication token is required'));
      return;
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      next(new Error('Invalid or expired authentication token'));
      return;
    }

    socket.data['userId'] = payload.sub;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data['userId'] as string;
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    registerMessageHandler(socket, userId);
    registerTypingHandler(socket, userId);
    registerPresenceHandler(io!, socket, userId);

    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  return io;
}
