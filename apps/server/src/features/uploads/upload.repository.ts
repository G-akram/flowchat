import { eq } from 'drizzle-orm';
import { db } from '../../lib/db';
import { messageAttachments, type DbMessageAttachment } from '../../db/schema/message-attachments';

export async function createAttachments(
  records: Array<{
    messageId: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>
): Promise<DbMessageAttachment[]> {
  const result = await db.insert(messageAttachments).values(records).returning();
  return result;
}

export async function findAttachmentsByMessageId(
  messageId: string
): Promise<DbMessageAttachment[]> {
  return db
    .select()
    .from(messageAttachments)
    .where(eq(messageAttachments.messageId, messageId));
}

export async function findAttachmentsByMessageIds(
  messageIds: string[]
): Promise<Map<string, DbMessageAttachment[]>> {
  if (messageIds.length === 0) {
    return new Map();
  }

  const { inArray } = await import('drizzle-orm');
  const rows = await db
    .select()
    .from(messageAttachments)
    .where(inArray(messageAttachments.messageId, messageIds));

  const map = new Map<string, DbMessageAttachment[]>();
  for (const row of rows) {
    const existing = map.get(row.messageId) ?? [];
    existing.push(row);
    map.set(row.messageId, existing);
  }

  return map;
}
