import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

export interface WorkspaceMember {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: string;
}

interface MembersResponse {
  data: {
    members: WorkspaceMember[];
  };
}

async function fetchMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await apiClient.get<MembersResponse>(
    `/workspaces/${workspaceId}/members`
  );
  return response.data.data.members;
}

interface UseWorkspaceMembersResult {
  members: WorkspaceMember[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useWorkspaceMembers(workspaceId: string | undefined): UseWorkspaceMembersResult {
  const { data, isLoading, isError } = useQuery<WorkspaceMember[], AxiosError<ApiError>>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => fetchMembers(workspaceId as string),
    enabled: Boolean(workspaceId),
  });

  return { members: data, isLoading, isError };
}
