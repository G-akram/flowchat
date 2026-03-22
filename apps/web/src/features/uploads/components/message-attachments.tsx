import React from 'react';
import type { AttachmentData } from '../types';

interface MessageAttachmentsProps {
  attachments: AttachmentData[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('text/')) return 'TXT';
  return 'FILE';
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps): React.JSX.Element | null {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {attachments.map((attachment) =>
        isImageMime(attachment.mimeType) ? (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-gray-200"
          >
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="max-h-[300px] max-w-[400px] object-contain"
              loading="lazy"
            />
          </a>
        ) : (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-600">
              {getFileIcon(attachment.mimeType)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-indigo-600 hover:underline">
                {attachment.fileName}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
          </a>
        )
      )}
    </div>
  );
}
