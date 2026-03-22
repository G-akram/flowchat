import { useMutation, useQueryClient, type InfiniteData, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MessageWithUser } from '../types';
import { messagesQueryKey } from './use-messages';

interface DeleteMessageVariables {
  channelId: string;
  messageId: string;
}

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

export function useDeleteMessage(): UseMutationResult<void, Error, DeleteMessageVariables> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteMessageVariables>({
    mutationFn: async ({ channelId, messageId }): Promise<void> => {
      await apiClient.delete(`/channels/${channelId}/messages/${messageId}`);
    },

    onMutate: async ({ channelId, messageId }) => {
      const key = messagesQueryKey(channelId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousData = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((msg) => msg.id !== messageId),
          })),
        };
      });

      return { previousData };
    },

    onError: (_error, { channelId }, context) => {
      const key = messagesQueryKey(channelId);
      const ctx = context as { previousData?: InfiniteData<MessagesPage> } | undefined;
      if (ctx?.previousData) {
        queryClient.setQueryData(key, ctx.previousData);
      }
    },
  });
}
