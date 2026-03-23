import React, { useCallback, useMemo } from 'react';
import { useMediaViewerStore, type MediaItem } from '@/stores/media-viewer-store';
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

function isPdfMime(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

function getFileIconLabel(mimeType: string): string {
  if (isPdfMime(mimeType)) return 'PDF';
  if (mimeType.startsWith('text/')) return 'TXT';
  return 'FILE';
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps): React.JSX.Element | null {
  if (attachments.length === 0) return null;

  const openViewer = useMediaViewerStore((s) => s.open);

  // Build the previewable gallery for this message (images + PDFs only)
  const mediaItems = useMemo((): MediaItem[] => {
    return attachments
      .filter((a) => isImageMime(a.mimeType) || isPdfMime(a.mimeType))
      .map((a) => ({ url: a.url, fileName: a.fileName, mimeType: a.mimeType }));
  }, [attachments]);

  const handleOpen = useCallback(
    (attachment: AttachmentData): void => {
      const index = mediaItems.findIndex((m) => m.url === attachment.url);
      if (index !== -1) {
        openViewer(mediaItems, index);
      }
    },
    [mediaItems, openViewer]
  );

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        if (isImageMime(attachment.mimeType)) {
          return (
            <button
              key={attachment.id}
              type="button"
              className="block overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              onClick={() => handleOpen(attachment)}
              title={`Open ${attachment.fileName}`}
            >
              <img
                src={attachment.url}
                alt={attachment.fileName}
                className="max-h-[300px] max-w-[400px] object-contain"
                loading="lazy"
              />
            </button>
          );
        }

        const isViewable = isPdfMime(attachment.mimeType);

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-bold text-primary">
              {getFileIconLabel(attachment.mimeType)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {isViewable && (
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={() => handleOpen(attachment)}
                >
                  Preview
                </button>
              )}
              <a
                href={attachment.url}
                download={attachment.fileName}
                className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
