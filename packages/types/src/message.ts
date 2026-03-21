import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string().min(1).max(4000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;
