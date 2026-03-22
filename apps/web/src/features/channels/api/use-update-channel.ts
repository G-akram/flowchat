import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError, Channel } from '@flowchat/types';

interface UpdateChannelInput {
  workspaceId: string;
  channelId: string;
  name?: string | undefined;
  description?: string | null | undefined;
}

interface UpdateChannelResponse {
  data: {
    channel: Channel;
  };
}

async function updateChannel({ workspaceId, channelId, ...body }: UpdateChannelInput): Promise<Channel> {
  const response = await apiClient.patch<UpdateChannelResponse>(
    `/workspaces/${workspaceId}/channels/${channelId}`,
    body
  );
  return response.data.data.channel;
}

interface UseUpdateChannelOptions {
  onSuccess?: (channel: Channel) => void;
}

export function useUpdateChannel(options?: UseUpdateChannelOptions): ReturnType<
  typeof useMutation<Channel, AxiosError<ApiError>, UpdateChannelInput>
> {
  const queryClient = useQueryClient();

  return useMutation<Channel, AxiosError<ApiError>, UpdateChannelInput>({
    mutationFn: updateChannel,
    onSuccess: (channel, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['channels', variables.workspaceId] });
      options?.onSuccess?.(channel);
    },
  });
}
