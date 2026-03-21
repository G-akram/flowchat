import type { Request, Response, NextFunction } from 'express';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { login, register, refresh, logout } from './auth.service';
import { AppError } from '../../lib/errors';

const REFRESH_COOKIE_NAME = 'refreshToken';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function loginHandler(
  req: Request<Record<string, never>, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await login(req.body);

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_MS,
    });

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

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_MS,
    });

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
      throw new AppError('TOKEN_INVALID', 'Refresh token is missing', 401);
    }

    const { user, tokens } = await refresh(refreshToken);

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_MS,
    });

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
