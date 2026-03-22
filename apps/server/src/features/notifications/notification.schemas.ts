import { z } from 'zod';

export const notificationParamsSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID'),
});

export type NotificationParams = z.infer<typeof notificationParamsSchema>;
