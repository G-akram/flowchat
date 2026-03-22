import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

interface AddChannelMemberInput {
  workspaceId: string;
  channelId: string;
  userId: string;
}

async function addChannelMember({ workspaceId, channelId, userId }: AddChannelMemberInput): Promise<void> {
  await apiClient.post(`/workspaces/${workspaceId}/channels/${channelId}/members`, { userId });
}

interface UseAddChannelMemberOptions {
  onSuccess?: () => void;
}

export function useAddChannelMember(options?: UseAddChannelMemberOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, AddChannelMemberInput>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, AddChannelMemberInput>({
    mutationFn: addChannelMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['channels', variables.workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['channel-members', variables.workspaceId, variables.channelId] });
      options?.onSuccess?.();
    },
  });
}
