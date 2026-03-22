import { z } from 'zod';

export const channelSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).nullable(),
  isPrivate: z.boolean(),
  isDirectMessage: z.boolean(),
  createdById: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type Channel = z.infer<typeof channelSchema>;
