import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PresignResponse } from '../types';

interface PresignInput {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export function usePresignUpload(): UseMutationResult<PresignResponse, Error, PresignInput> {
  return useMutation<PresignResponse, Error, PresignInput>({
    mutationFn: async (input): Promise<PresignResponse> => {
      const response = await apiClient.post<{ data: PresignResponse }>(
        '/uploads/presign',
        input
      );
      return response.data.data;
    },
  });
}
