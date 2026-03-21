import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(32),
  displayName: z.string().min(1).max(64),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
