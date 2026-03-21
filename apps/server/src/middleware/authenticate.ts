import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';
import { findUserById } from '../features/auth/auth.repository';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
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

  const dbUser = await findUserById(payload.sub);

  if (!dbUser) {
    next(new AppError('UNAUTHORIZED', 'User not found', 401));
    return;
  }

  req.user = {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.displayName,
  };

  next();
}
