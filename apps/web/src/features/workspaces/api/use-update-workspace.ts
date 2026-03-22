import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError, Workspace } from '@flowchat/types';

interface UpdateWorkspaceInput {
  workspaceId: string;
  name: string;
}

interface UpdateWorkspaceResponse {
  data: {
    workspace: Workspace;
  };
}

async function updateWorkspace({ workspaceId, name }: UpdateWorkspaceInput): Promise<Workspace> {
  const response = await apiClient.patch<UpdateWorkspaceResponse>(
    `/workspaces/${workspaceId}`,
    { name }
  );
  return response.data.data.workspace;
}

interface UseUpdateWorkspaceOptions {
  onSuccess?: (workspace: Workspace) => void;
}

export function useUpdateWorkspace(options?: UseUpdateWorkspaceOptions): ReturnType<
  typeof useMutation<Workspace, AxiosError<ApiError>, UpdateWorkspaceInput>
> {
  const queryClient = useQueryClient();

  return useMutation<Workspace, AxiosError<ApiError>, UpdateWorkspaceInput>({
    mutationFn: updateWorkspace,
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      options?.onSuccess?.(workspace);
    },
  });
}
