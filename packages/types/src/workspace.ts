import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  slug: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/),
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type Workspace = z.infer<typeof workspaceSchema>;
