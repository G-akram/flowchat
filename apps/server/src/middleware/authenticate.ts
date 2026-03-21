import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 'Missing or malformed authorization header', 401));
    return;
  }

  const token = authHeader.slice(7);

  let payload: JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError('TOKEN_EXPIRED', 'Access token has expired', 401));
      return;
    }
    next(new AppError('TOKEN_INVALID', 'Invalid access token', 401));
    return;
  }

  req.userId = payload.sub;
  next();
}
