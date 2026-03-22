import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { PresignUploadInput, ConfirmUploadInput } from './upload.schemas';
import { createAttachments } from './upload.repository';
import { findMessageById } from '../messages/message.repository';

interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

function buildStorageKey(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  return `uploads/${randomUUID()}${ext}`;
}

export async function presign(input: PresignUploadInput): Promise<PresignResult> {
  const key = buildStorageKey(input.fileName);

  const { data, error } = await supabase.storage
    .from(env.SUPABASE_BUCKET_NAME)
    .createSignedUploadUrl(key);

  if (error || !data) {
    throw new AppError('UPLOAD_FAILED', 'Failed to generate upload URL', 500);
  }

  const { data: publicData } = supabase.storage
    .from(env.SUPABASE_BUCKET_NAME)
    .getPublicUrl(key);

  return {
    uploadUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
    key,
  };
}

export async function confirmUpload(
  input: ConfirmUploadInput,
  userId: string
): Promise<void> {
  const message = await findMessageById(input.messageId);

  if (!message) {
    throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', 404);
  }

  if (message.userId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only attach files to your own messages', 403);
  }

  const records = input.attachments.map((attachment) => {
    const { data: publicData } = supabase.storage
      .from(env.SUPABASE_BUCKET_NAME)
      .getPublicUrl(attachment.key);

    return {
      messageId: input.messageId,
      url: publicData.publicUrl,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
    };
  });

  await createAttachments(records);
}
