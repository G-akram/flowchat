import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';
import type { DirectMessage } from '../types';
import { DMS_QUERY_KEY } from './use-direct-messages';

interface OpenDmResponse {
  data: {
    dm: DirectMessage;
  };
}

interface OpenDmVariables {
  workspaceId: string;
  userId: string;
}

export function useOpenDm(): {
  mutateAsync: (variables: OpenDmVariables) => Promise<DirectMessage>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation<DirectMessage, AxiosError<ApiError>, OpenDmVariables>({
    mutationFn: async ({ workspaceId, userId }: OpenDmVariables): Promise<DirectMessage> => {
      const response = await apiClient.post<OpenDmResponse>(
        `/workspaces/${workspaceId}/dms`,
        { userId }
      );
      return response.data.data.dm;
    },
    onSuccess: (_data, variables): void => {
      queryClient.invalidateQueries({ queryKey: [DMS_QUERY_KEY, variables.workspaceId] });
    },
  });

  return { mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}
