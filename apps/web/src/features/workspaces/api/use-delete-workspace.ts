import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

async function deleteWorkspace(workspaceId: string): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}`);
}

interface UseDeleteWorkspaceOptions {
  onSuccess?: () => void;
}

export function useDeleteWorkspace(options?: UseDeleteWorkspaceOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, string>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      options?.onSuccess?.();
    },
  });
}
