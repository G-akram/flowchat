import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../lib/env';
import { AppError } from '../../lib/errors';
import type { User } from '@flowchat/types';
import type { LoginInput, RegisterInput } from './auth.schemas';
import {
  findUserByEmail,
  findUserById,
  createUser,
  storeRefreshToken,
  findRefreshTokenByHash,
  deleteRefreshTokenByHash,
} from './auth.repository';
import type { DbUser } from '../../db/schema/users';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

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

function generateRawRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createTokenPair(userId: string): Promise<TokenPair> {
  const accessToken = generateAccessToken(userId);
  const rawRefreshToken = generateRawRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await storeRefreshToken({ userId, tokenHash, expiresAt });

  return { accessToken, refreshToken: rawRefreshToken };
}

export async function login(input: LoginInput): Promise<{ user: User; tokens: TokenPair }> {
  const email = input.email.toLowerCase();
  const dbUser = await findUserByEmail(email);

  if (!dbUser) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const passwordMatch = await bcrypt.compare(input.password, dbUser.passwordHash);

  if (!passwordMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const tokens = await createTokenPair(dbUser.id);

  return { user: mapDbUserToUser(dbUser), tokens };
}

export async function register(
  input: RegisterInput
): Promise<{ user: User; tokens: TokenPair }> {
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409, 'email');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const dbUser = await createUser({
    email,
    username: input.username,
    displayName: input.displayName,
    passwordHash,
    avatarUrl: null,
  });

  const tokens = await createTokenPair(dbUser.id);

  return { user: mapDbUserToUser(dbUser), tokens };
}

export async function refresh(
  rawRefreshToken: string
): Promise<{ user: User; tokens: TokenPair }> {
  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw new AppError('TOKEN_EXPIRED', 'Refresh token is invalid or has been revoked', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await deleteRefreshTokenByHash(tokenHash);
    throw new AppError('TOKEN_EXPIRED', 'Refresh token has expired', 401);
  }

  const dbUser = await findUserById(storedToken.userId);

  if (!dbUser) {
    throw new AppError('UNAUTHORIZED', 'User not found', 401);
  }

  await deleteRefreshTokenByHash(tokenHash);

  const tokens = await createTokenPair(dbUser.id);

  return { user: mapDbUserToUser(dbUser), tokens };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await deleteRefreshTokenByHash(tokenHash);
}
