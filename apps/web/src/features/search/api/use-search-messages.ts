import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SearchResultMessage } from '../types';

const SEARCH_QUERY_KEY = 'search-messages';
const SEARCH_LIMIT = 20;

interface SearchResponse {
  data: {
    messages: SearchResultMessage[];
  };
}

export function useSearchMessages(workspaceId: string | undefined, query: string) {
  const trimmed = query.trim();

  return useQuery<SearchResultMessage[], Error>({
    queryKey: [SEARCH_QUERY_KEY, workspaceId, trimmed],
    queryFn: async (): Promise<SearchResultMessage[]> => {
      const response = await apiClient.get<SearchResponse>(
        `/workspaces/${workspaceId}/search`,
        { params: { q: trimmed, limit: SEARCH_LIMIT } }
      );

      return response.data.data.messages;
    },
    enabled: Boolean(workspaceId) && trimmed.length > 0,
    staleTime: 1000 * 30,
  });
}
