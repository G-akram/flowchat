import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { defaultRateLimit } from './middleware/rate-limit';
import { authRouter } from './features/auth/auth.routes';

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

app.use(errorHandler);
