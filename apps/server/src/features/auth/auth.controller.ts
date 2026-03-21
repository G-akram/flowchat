import type { Request, Response, NextFunction } from 'express';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { login, register, refresh, logout } from './auth.service';
import { findUserById } from './auth.repository';
import { AppError } from '../../lib/errors';
import type { User } from '@flowchat/types';

const REFRESH_COOKIE_NAME = 'refreshToken';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export async function loginHandler(
  req: Request<Record<string, never>, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await login(req.body);

    setRefreshCookie(res, tokens.refreshToken);

    res.status(200).json({
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function registerHandler(
  req: Request<Record<string, never>, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await register(req.body);

    setRefreshCookie(res, tokens.refreshToken);

    res.status(201).json({
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as unknown;

    if (typeof refreshToken !== 'string') {
      throw new AppError('UNAUTHORIZED', 'Refresh token is missing', 401);
    }

    const { user, tokens } = await refresh(refreshToken);

    setRefreshCookie(res, tokens.refreshToken);

    res.status(200).json({
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as unknown;

    if (typeof refreshToken === 'string') {
      await logout(refreshToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const dbUser = await findUserById(user.id);

    if (!dbUser) {
      throw new AppError('UNAUTHORIZED', 'User not found', 401);
    }

    const responseUser: User = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      displayName: dbUser.displayName,
      avatarUrl: dbUser.avatarUrl ?? null,
      createdAt: dbUser.createdAt.toISOString(),
    };

    res.status(200).json({ data: { user: responseUser } });
  } catch (err) {
    next(err);
  }
}
