import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError, Workspace } from '@flowchat/types';

interface WorkspacesResponse {
  data: {
    workspaces: Workspace[];
  };
}

async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await apiClient.get<WorkspacesResponse>('/workspaces');
  return response.data.data.workspaces;
}

interface UseWorkspacesResult {
  workspaces: Workspace[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useWorkspaces(): UseWorkspacesResult {
  const { data, isLoading, isError } = useQuery<Workspace[], AxiosError<ApiError>>({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });

  return { workspaces: data, isLoading, isError };
}
