import { pgTable, uuid, text, varchar, integer, index } from 'drizzle-orm/pg-core';
import { messages } from './messages';

export const messageAttachments = pgTable(
  'message_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', { length: 127 }).notNull(),
  },
  (t) => [index('message_attachments_message_id_idx').on(t.messageId)]
);

export type DbMessageAttachment = typeof messageAttachments.$inferSelect;
export type NewDbMessageAttachment = typeof messageAttachments.$inferInsert;
