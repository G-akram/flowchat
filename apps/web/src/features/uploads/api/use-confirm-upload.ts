import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ConfirmAttachment {
  key: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

interface ConfirmUploadInput {
  messageId: string;
  attachments: ConfirmAttachment[];
}

export function useConfirmUpload(): UseMutationResult<void, Error, ConfirmUploadInput> {
  return useMutation<void, Error, ConfirmUploadInput>({
    mutationFn: async (input): Promise<void> => {
      await apiClient.post('/uploads/confirm', input);
    },
  });
}
