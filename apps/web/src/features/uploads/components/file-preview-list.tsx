import React from 'react';
import type { PendingUpload } from '../types';

interface FilePreviewListProps {
  uploads: PendingUpload[];
  onRemove: (index: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewList({ uploads, onRemove }: FilePreviewListProps): React.JSX.Element | null {
  if (uploads.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {uploads.map((upload, index) => {
        const isImage = upload.file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(upload.file) : null;

        return (
          <div
            key={`${upload.file.name}-${index}`}
            className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={upload.file.name}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                {upload.file.name.split('.').pop()?.toUpperCase() ?? 'FILE'}
              </div>
            )}

            <div className="min-w-0 max-w-[120px]">
              <p className="truncate text-xs font-medium text-gray-700">
                {upload.file.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(upload.file.size)}
              </p>
              {upload.status === 'uploading' && upload.progress > 0 && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.status === 'error' && (
                <p className="text-xs text-red-500">Failed</p>
              )}
            </div>

            <button
              type="button"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-xs text-white hover:bg-gray-800"
              onClick={() => onRemove(index)}
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
