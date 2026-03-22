import { z } from 'zod';

export const channelParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  channelId: z.string().uuid('Invalid channel ID'),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Channel name must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  isPrivate: z.boolean().optional().default(false),
});

export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Channel name must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').nullable().optional(),
});

export const addChannelMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type ChannelParams = z.infer<typeof channelParamsSchema>;
export type WorkspaceParams = z.infer<typeof workspaceParamsSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type AddChannelMemberInput = z.infer<typeof addChannelMemberSchema>;
