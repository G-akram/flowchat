import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

interface LeaveChannelInput {
  workspaceId: string;
  channelId: string;
}

async function leaveChannel({ workspaceId, channelId }: LeaveChannelInput): Promise<void> {
  await apiClient.post(`/workspaces/${workspaceId}/channels/${channelId}/leave`);
}

interface UseLeaveChannelOptions {
  onSuccess?: () => void;
}

export function useLeaveChannel(options?: UseLeaveChannelOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, LeaveChannelInput>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, LeaveChannelInput>({
    mutationFn: leaveChannel,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['channels', variables.workspaceId] });
      options?.onSuccess?.();
    },
  });
}
