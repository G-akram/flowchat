import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';
import type { DirectMessage } from '../types';

interface DmsResponse {
  data: {
    dms: DirectMessage[];
  };
}

async function fetchDms(workspaceId: string): Promise<DirectMessage[]> {
  const response = await apiClient.get<DmsResponse>(
    `/workspaces/${workspaceId}/dms`
  );
  return response.data.data.dms;
}

export const DMS_QUERY_KEY = 'dms';

interface UseDirectMessagesResult {
  dms: DirectMessage[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useDirectMessages(workspaceId: string | undefined): UseDirectMessagesResult {
  const { data, isLoading, isError } = useQuery<DirectMessage[], AxiosError<ApiError>>({
    queryKey: [DMS_QUERY_KEY, workspaceId],
    queryFn: () => fetchDms(workspaceId as string),
    enabled: Boolean(workspaceId),
  });

  return { dms: data, isLoading, isError };
}
