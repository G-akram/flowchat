import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

interface DeleteChannelInput {
  workspaceId: string;
  channelId: string;
}

async function deleteChannel({ workspaceId, channelId }: DeleteChannelInput): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/channels/${channelId}`);
}

interface UseDeleteChannelOptions {
  onSuccess?: () => void;
}

export function useDeleteChannel(options?: UseDeleteChannelOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, DeleteChannelInput>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, DeleteChannelInput>({
    mutationFn: deleteChannel,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['channels', variables.workspaceId] });
      options?.onSuccess?.();
    },
  });
}
