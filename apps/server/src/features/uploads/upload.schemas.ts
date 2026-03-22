import { z } from 'zod';

const ALLOWED_MIME_PATTERNS = [
  /^image\/.+$/,
  /^application\/pdf$/,
  /^text\/.+$/,
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export const presignUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  mimeType: z.string().min(1, 'MIME type is required').refine(
    (mime) => ALLOWED_MIME_PATTERNS.some((pattern) => pattern.test(mime)),
    'File type not allowed. Allowed: images, PDF, text files'
  ),
  fileSize: z.number().int().positive('File size must be positive').max(
    MAX_FILE_SIZE,
    `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
  ),
});

export const confirmUploadSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  attachments: z.array(
    z.object({
      key: z.string().min(1, 'Storage key is required'),
      fileName: z.string().min(1, 'File name is required').max(255),
      mimeType: z.string().min(1, 'MIME type is required'),
      fileSize: z.number().int().positive(),
    })
  ).min(1, 'At least one attachment is required').max(10, 'Maximum 10 attachments per message'),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
