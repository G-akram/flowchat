import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedSocket {
  userId: string;
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
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

    (socket as typeof socket & { userId: string }).userId = payload.sub;
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket as typeof socket & { userId: string }).userId;
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  return io;
}
