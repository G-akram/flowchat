import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { apiClient } from '@/lib/api-client';
import type { PresignResponse, PendingUpload } from '../types';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_PATTERNS = [
  /^image\/.+$/,
  /^application\/pdf$/,
  /^text\/.+$/,
];

const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8,
};

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_PATTERNS.some((pattern) => pattern.test(mimeType));
}

async function maybeCompressImage(file: File): Promise<File> {
  if (!isImageFile(file)) return file;

  const compressed = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
  return new File([compressed], file.name, { type: compressed.type });
}

interface UploadResult {
  key: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

interface UseFileUploadReturn {
  pendingUploads: PendingUpload[];
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  uploadAll: () => Promise<UploadResult[]>;
  clearAll: () => void;
  hasFiles: boolean;
}

export function useFileUpload(): UseFileUploadReturn {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  const addFiles = useCallback((files: File[]): void => {
    const valid = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) return false;
      if (!isAllowedMimeType(file.type)) return false;
      return true;
    });

    const newUploads: PendingUpload[] = valid.map((file) => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      key: '',
      publicUrl: '',
    }));

    setPendingUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const removeFile = useCallback((index: number): void => {
    setPendingUploads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback((): void => {
    setPendingUploads([]);
  }, []);

  const uploadAll = useCallback(async (): Promise<UploadResult[]> => {
    const current = pendingUploads.filter((u) => u.status !== 'done');
    const results: UploadResult[] = [];

    for (let i = 0; i < current.length; i++) {
      const upload = current[i];
      if (!upload) continue;

      try {
        const fileToUpload = await maybeCompressImage(upload.file);

        const presignResponse = await apiClient.post<{ data: PresignResponse }>(
          '/uploads/presign',
          {
            fileName: fileToUpload.name,
            mimeType: fileToUpload.type,
            fileSize: fileToUpload.size,
          }
        );

        const { uploadUrl, publicUrl, key } = presignResponse.data.data;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', fileToUpload.type);

          xhr.upload.onprogress = (event): void => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setPendingUploads((prev) =>
                prev.map((u, idx) =>
                  idx === i ? { ...u, progress } : u
                )
              );
            }
          };

          xhr.onload = (): void => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = (): void => {
            reject(new Error('Upload failed'));
          };

          xhr.send(fileToUpload);
        });

        setPendingUploads((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: 'done' as const, progress: 100, key, publicUrl } : u
          )
        );

        results.push({
          key,
          publicUrl,
          fileName: fileToUpload.name,
          mimeType: fileToUpload.type,
          fileSize: fileToUpload.size,
        });
      } catch {
        setPendingUploads((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: 'error' as const } : u
          )
        );
      }
    }

    return results;
  }, [pendingUploads]);

  return {
    pendingUploads,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    hasFiles: pendingUploads.length > 0,
  };
}
