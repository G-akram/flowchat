export interface AttachmentData {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface PendingUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  key: string;
  publicUrl: string;
}
