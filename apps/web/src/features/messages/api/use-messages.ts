import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MessageWithUser } from '../types';
import { MESSAGES_QUERY_KEY, DEFAULT_MESSAGE_LIMIT } from '../constants';

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

export function messagesQueryKey(channelId: string): readonly [string, string] {
  return [MESSAGES_QUERY_KEY, channelId] as const;
}

export function useMessages(channelId: string | undefined): UseInfiniteQueryResult<InfiniteData<MessagesPage>, Error> {
  return useInfiniteQuery<MessagesPage, Error>({
    queryKey: messagesQueryKey(channelId ?? ''),
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      const params: Record<string, string | number> = { limit: DEFAULT_MESSAGE_LIMIT };
      if (pageParam) {
        params['cursor'] = pageParam as string;
      }

      const response = await apiClient.get<MessagesPage>(
        `/channels/${channelId}/messages`,
        { params }
      );

      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage): string | undefined => lastPage.nextCursor ?? undefined,
    enabled: Boolean(channelId),
    staleTime: 1000 * 60 * 2,
  });
}
