import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';

interface InviteMemberInput {
  workspaceId: string;
  email: string;
}

interface InviteMemberResponse {
  data: {
    member: { userId: string; role: string };
  };
}

async function inviteMember({ workspaceId, email }: InviteMemberInput): Promise<{ userId: string; role: string }> {
  const response = await apiClient.post<InviteMemberResponse>(
    `/workspaces/${workspaceId}/members`,
    { email }
  );
  return response.data.data.member;
}

interface UseInviteMemberOptions {
  onSuccess?: () => void;
}

export function useInviteMember(options?: UseInviteMemberOptions): ReturnType<
  typeof useMutation<{ userId: string; role: string }, AxiosError<ApiError>, InviteMemberInput>
> {
  const queryClient = useQueryClient();

  return useMutation<{ userId: string; role: string }, AxiosError<ApiError>, InviteMemberInput>({
    mutationFn: inviteMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] });
      options?.onSuccess?.();
    },
  });
}
