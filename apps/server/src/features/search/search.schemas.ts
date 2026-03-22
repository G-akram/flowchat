import { z } from 'zod';

export const searchParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query too long'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
