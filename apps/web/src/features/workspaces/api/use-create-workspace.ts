import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError, Workspace } from '@flowchat/types';

interface CreateWorkspaceInput {
  name: string;
}

interface CreateWorkspaceResponse {
  data: {
    workspace: Workspace;
  };
}

async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const response = await apiClient.post<CreateWorkspaceResponse>('/workspaces', input);
  return response.data.data.workspace;
}

interface UseCreateWorkspaceOptions {
  onSuccess?: (workspace: Workspace) => void;
}

export function useCreateWorkspace(options?: UseCreateWorkspaceOptions): ReturnType<
  typeof useMutation<Workspace, AxiosError<ApiError>, CreateWorkspaceInput>
> {
  const queryClient = useQueryClient();

  return useMutation<Workspace, AxiosError<ApiError>, CreateWorkspaceInput>({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      options?.onSuccess?.(workspace);
    },
  });
}
