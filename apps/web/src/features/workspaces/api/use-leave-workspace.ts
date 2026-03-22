import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

async function leaveWorkspace(workspaceId: string): Promise<void> {
  await apiClient.post(`/workspaces/${workspaceId}/leave`);
}

interface UseLeaveWorkspaceOptions {
  onSuccess?: () => void;
}

export function useLeaveWorkspace(options?: UseLeaveWorkspaceOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, string>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: leaveWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      options?.onSuccess?.();
    },
  });
}
