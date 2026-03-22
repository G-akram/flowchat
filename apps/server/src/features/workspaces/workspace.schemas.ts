import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(64, 'Workspace name must be at most 64 characters'),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(64, 'Workspace name must be at most 64 characters'),
});

export const memberParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceParams = z.infer<typeof workspaceParamsSchema>;
export type MemberParams = z.infer<typeof memberParamsSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
