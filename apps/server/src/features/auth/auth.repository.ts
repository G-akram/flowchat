import { eq } from 'drizzle-orm';
import { db } from '../../lib/db';
import { users, type DbUser, type NewDbUser } from '../../db/schema/users';
import { refreshTokens, type DbRefreshToken } from '../../db/schema/refresh-tokens';

export async function findUserByEmail(email: string): Promise<DbUser | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function findUserById(id: string): Promise<DbUser | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function createUser(
  input: Omit<NewDbUser, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DbUser> {
  const result = await db.insert(users).values(input).returning();
  const created = result[0];

  if (!created) {
    throw new Error('Failed to create user');
  }

  return created;
}

export async function storeRefreshToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await db.insert(refreshTokens).values(input);
}

export async function findRefreshTokenByHash(
  tokenHash: string
): Promise<DbRefreshToken | undefined> {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  return result[0];
}

export async function deleteRefreshTokenByHash(tokenHash: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function deleteRefreshTokensByUserId(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
