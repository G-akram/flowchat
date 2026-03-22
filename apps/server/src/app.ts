import crypto from 'crypto';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { pool } from './lib/db';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/error-handler';
import { defaultRateLimit } from './middleware/rate-limit';
import { authRouter } from './features/auth/auth.routes';
import { workspaceRouter } from './features/workspaces/workspace.routes';
import { channelRouter } from './features/channels/channel.routes';
import { messageRouter } from './features/messages/message.routes';
import { reactionRouter } from './features/reactions/reaction.routes';
import { userRouter, presenceRouter } from './features/users/user.routes';
import { dmRouter } from './features/dm/dm.routes';
import { searchRouter } from './features/search/search.routes';
import { uploadRouter } from './features/uploads/upload.routes';
import { notificationRouter } from './features/notifications/notification.routes';

export const app: Express = express();

app.use(
  pinoHttp({
    logger,
    genReqId: (_req, res) => {
      const id = crypto.randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(defaultRateLimit);

app.get('/api/health', async (_req: Request, res: Response) => {
  let dbConnected = false;
  let redisConnected = false;

  try {
    const client = await pool.connect();
    client.release();
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  try {
    const pong = await redis.ping();
    redisConnected = pong === 'PONG';
  } catch {
    redisConnected = false;
  }

  const status = dbConnected && redisConnected ? 'ok' : 'degraded';
  const statusCode = status === 'ok' ? 200 : 503;

  res.status(statusCode).json({
    data: {
      status,
      timestamp: new Date().toISOString(),
      dbConnected,
      redisConnected,
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/workspaces/:workspaceId/channels', channelRouter);
app.use('/api/channels/:channelId/messages', messageRouter);
app.use('/api/messages/:messageId/reactions', reactionRouter);
app.use('/api/users', userRouter);
app.use('/api/workspaces/:workspaceId/dms', dmRouter);
app.use('/api/workspaces/:workspaceId/presence', presenceRouter);
app.use('/api/workspaces/:workspaceId/search', searchRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/notifications', notificationRouter);

app.use(errorHandler);
