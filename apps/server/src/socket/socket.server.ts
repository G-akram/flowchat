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

interface SocketData {
  userId: string;
}

let io: SocketServer | null = null;

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const server = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  server.use((socket, next) => {
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

    (socket.data as SocketData).userId = payload.sub;
    next();
  });

  server.on('connection', (socket) => {
    const userId = (socket.data as SocketData).userId;
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    registerMessageHandler(socket, userId);
    registerTypingHandler(socket, userId);
    registerPresenceHandler(server, socket, userId);

    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  io = server;
  return server;
}
