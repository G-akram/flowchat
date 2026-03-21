import { z } from 'zod';

export const reactionParamsSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
});

export const removeReactionParamsSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  emoji: z.string().min(1).max(64),
});

export const addReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji is required').max(64, 'Emoji too long'),
});

export type ReactionParams = z.infer<typeof reactionParamsSchema>;
export type RemoveReactionParams = z.infer<typeof removeReactionParamsSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
