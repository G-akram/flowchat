import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

export interface ChannelMember {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface ChannelMembersResponse {
  data: {
    members: ChannelMember[];
  };
}

async function fetchChannelMembers(
  workspaceId: string,
  channelId: string
): Promise<ChannelMember[]> {
  const response = await apiClient.get<ChannelMembersResponse>(
    `/workspaces/${workspaceId}/channels/${channelId}/members`
  );
  return response.data.data.members;
}

interface UseChannelMembersResult {
  members: ChannelMember[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useChannelMembers(
  workspaceId: string | undefined,
  channelId: string | undefined
): UseChannelMembersResult {
  const { data, isLoading, isError } = useQuery<ChannelMember[], AxiosError<ApiError>>({
    queryKey: ['channel-members', workspaceId, channelId],
    queryFn: () => fetchChannelMembers(workspaceId as string, channelId as string),
    enabled: Boolean(workspaceId) && Boolean(channelId),
  });

  return { members: data, isLoading, isError };
}
