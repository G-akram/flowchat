import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError, Channel } from '@flowchat/types';

interface CreateChannelInput {
  workspaceId: string;
  name: string;
  description?: string | undefined;
  isPrivate?: boolean | undefined;
}

interface CreateChannelResponse {
  data: {
    channel: Channel;
  };
}

async function createChannel({ workspaceId, ...body }: CreateChannelInput): Promise<Channel> {
  const response = await apiClient.post<CreateChannelResponse>(
    `/workspaces/${workspaceId}/channels`,
    body
  );
  return response.data.data.channel;
}

interface UseCreateChannelOptions {
  onSuccess?: (channel: Channel) => void;
}

export function useCreateChannel(options?: UseCreateChannelOptions): ReturnType<
  typeof useMutation<Channel, AxiosError<ApiError>, CreateChannelInput>
> {
  const queryClient = useQueryClient();

  return useMutation<Channel, AxiosError<ApiError>, CreateChannelInput>({
    mutationFn: createChannel,
    onSuccess: (channel, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['channels', variables.workspaceId] });
      options?.onSuccess?.(channel);
    },
  });
}
