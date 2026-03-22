import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

interface KickChannelMemberInput {
  workspaceId: string;
  channelId: string;
  userId: string;
}

async function kickChannelMember({ workspaceId, channelId, userId }: KickChannelMemberInput): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/channels/${channelId}/members/${userId}`);
}

interface UseKickChannelMemberOptions {
  onSuccess?: () => void;
}

export function useKickChannelMember(options?: UseKickChannelMemberOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, KickChannelMemberInput>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, KickChannelMemberInput>({
    mutationFn: kickChannelMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['channel-members', variables.workspaceId, variables.channelId] });
      options?.onSuccess?.();
    },
  });
}
