import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useUnreadStore } from '@/stores/unread-store';
import type { ApiError } from '@flowchat/types';

interface UnreadCountEntry {
  channelId: string;
  unreadCount: number;
}

interface UnreadCountsResponse {
  data: {
    unreadCounts: UnreadCountEntry[];
  };
}

async function fetchUnreadCounts(workspaceId: string): Promise<UnreadCountEntry[]> {
  const response = await apiClient.get<UnreadCountsResponse>(
    `/workspaces/${workspaceId}/channels/unread`
  );
  return response.data.data.unreadCounts;
}

export function useUnreadCounts(workspaceId: string | undefined): void {
  const setUnreadCounts = useUnreadStore((s) => s.setUnreadCounts);

  const { data } = useQuery<UnreadCountEntry[], AxiosError<ApiError>>({
    queryKey: ['unread-counts', workspaceId],
    queryFn: () => fetchUnreadCounts(workspaceId as string),
    enabled: Boolean(workspaceId),
  });

  useEffect(() => {
    if (!data) return;

    const counts: Record<string, number> = {};
    for (const entry of data) {
      if (entry.unreadCount > 0) {
        counts[entry.channelId] = entry.unreadCount;
      }
    }
    setUnreadCounts(counts);
  }, [data, setUnreadCounts]);
}
