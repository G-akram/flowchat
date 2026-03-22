import { z } from 'zod';

export const dmWorkspaceParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export const openDmSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type DmWorkspaceParams = z.infer<typeof dmWorkspaceParamsSchema>;
export type OpenDmInput = z.infer<typeof openDmSchema>;
