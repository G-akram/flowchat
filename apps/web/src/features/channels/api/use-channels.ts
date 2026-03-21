import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError, Channel } from '@flowchat/types';

interface ChannelsResponse {
  data: {
    channels: Channel[];
  };
}

async function fetchChannels(workspaceId: string): Promise<Channel[]> {
  const response = await apiClient.get<ChannelsResponse>(
    `/workspaces/${workspaceId}/channels`
  );
  return response.data.data.channels;
}

interface UseChannelsResult {
  channels: Channel[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useChannels(workspaceId: string | undefined): UseChannelsResult {
  const { data, isLoading, isError } = useQuery<Channel[], AxiosError<ApiError>>({
    queryKey: ['channels', workspaceId],
    queryFn: () => fetchChannels(workspaceId as string),
    enabled: Boolean(workspaceId),
  });

  return { channels: data, isLoading, isError };
}
