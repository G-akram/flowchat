import { z } from 'zod';

export const channelParamsSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
});

export const messageParamsSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
  messageId: z.string().uuid('Invalid message ID'),
});

const attachmentInputSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
  attachments: z.array(attachmentInputSchema).max(10).optional(),
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
