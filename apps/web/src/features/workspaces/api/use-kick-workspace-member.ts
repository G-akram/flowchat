import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

interface KickMemberInput {
  workspaceId: string;
  userId: string;
}

async function kickMember({ workspaceId, userId }: KickMemberInput): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
}

interface UseKickWorkspaceMemberOptions {
  onSuccess?: () => void;
}

export function useKickWorkspaceMember(options?: UseKickWorkspaceMemberOptions): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, KickMemberInput>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, KickMemberInput>({
    mutationFn: kickMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] });
      options?.onSuccess?.();
    },
  });
}
