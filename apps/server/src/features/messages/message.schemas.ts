import { z } from 'zod';

export const channelParamsSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
});

export const messageParamsSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
  messageId: z.string().uuid('Invalid message ID'),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
});

export const listMessagesQuerySchema = z.object({
  cursor: z.string().uuid('Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type ChannelParams = z.infer<typeof channelParamsSchema>;
export type MessageParams = z.infer<typeof messageParamsSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
