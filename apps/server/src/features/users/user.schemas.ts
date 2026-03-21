import { z } from 'zod';

export const userParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(64, 'Display name must be at most 64 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .nullable()
    .optional(),
});

export const workspacePresenceParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export type UserParams = z.infer<typeof userParamsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type WorkspacePresenceParams = z.infer<typeof workspacePresenceParamsSchema>;
