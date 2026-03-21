import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../lib/env';
import { AppError } from '../../lib/errors';
import { redis } from '../../lib/redis';
import type { User } from '@flowchat/types';
import type { LoginInput, RegisterInput } from './auth.schemas';
import {
  findUserByEmail,
  findUserById,
  createUser,
} from './auth.repository';
import type { DbUser } from '../../db/schema/users';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    displayName: dbUser.displayName,
    avatarUrl: dbUser.avatarUrl ?? null,
    createdAt: dbUser.createdAt.toISOString(),
  };
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  await redis.set(`refresh:${token}`, userId, 'EX', REFRESH_TOKEN_TTL_SECONDS);
}

async function revokeRefreshToken(token: string): Promise<void> {
  await redis.del(`refresh:${token}`);
}

export async function login(input: LoginInput): Promise<{ user: User; tokens: TokenPair }> {
  const dbUser = await findUserByEmail(input.email);

  if (!dbUser) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const passwordMatch = await bcrypt.compare(input.password, dbUser.passwordHash);

  if (!passwordMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(dbUser.id);
  const refreshToken = generateRefreshToken(dbUser.id);

  await storeRefreshToken(dbUser.id, refreshToken);

  return {
    user: mapDbUserToUser(dbUser),
    tokens: { accessToken, refreshToken },
  };
}

export async function register(
  input: RegisterInput
): Promise<{ user: User; tokens: TokenPair }> {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw new AppError('USER_ALREADY_EXISTS', 'An account with this email already exists', 409, 'email');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const dbUser = await createUser({
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    passwordHash,
    avatarUrl: null,
  });

  const accessToken = generateAccessToken(dbUser.id);
  const refreshToken = generateRefreshToken(dbUser.id);

  await storeRefreshToken(dbUser.id, refreshToken);

  return {
    user: mapDbUserToUser(dbUser),
    tokens: { accessToken, refreshToken },
  };
}

export async function refresh(
  refreshToken: string
): Promise<{ user: User; tokens: TokenPair }> {
  let payload: { sub: string };

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new AppError('TOKEN_INVALID', 'Invalid or expired refresh token', 401);
  }

  const storedUserId = await redis.get(`refresh:${refreshToken}`);

  if (!storedUserId || storedUserId !== payload.sub) {
    throw new AppError('TOKEN_INVALID', 'Refresh token has been revoked', 401);
  }

  const dbUser = await findUserById(payload.sub);

  if (!dbUser) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  await revokeRefreshToken(refreshToken);

  const newAccessToken = generateAccessToken(dbUser.id);
  const newRefreshToken = generateRefreshToken(dbUser.id);

  await storeRefreshToken(dbUser.id, newRefreshToken);

  return {
    user: mapDbUserToUser(dbUser),
    tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
}
