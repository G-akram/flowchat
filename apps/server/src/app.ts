import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './lib/env';
import { logger } from './lib/logger';
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

export const app: Express = express();

app.use(
  pinoHttp({
    logger,
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

app.get('/health', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
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

app.use(errorHandler);
