import { useMutation, useQueryClient, type InfiniteData, type UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MessageWithUser } from '../types';
import { messagesQueryKey } from './use-messages';

interface EditMessageVariables {
  channelId: string;
  messageId: string;
  content: string;
}

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

export function useEditMessage(): UseMutationResult<MessageWithUser, Error, EditMessageVariables> {
  const queryClient = useQueryClient();

  return useMutation<MessageWithUser, Error, EditMessageVariables>({
    mutationFn: async ({ channelId, messageId, content }): Promise<MessageWithUser> => {
      const response = await apiClient.patch<{ data: { message: MessageWithUser } }>(
        `/channels/${channelId}/messages/${messageId}`,
        { content }
      );
      return response.data.data.message;
    },

    onMutate: async ({ channelId, messageId, content }) => {
      const key = messagesQueryKey(channelId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousData = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.id === messageId
                ? { ...msg, content, editedAt: new Date().toISOString() }
                : msg
            ),
          })),
        };
      });

      return { previousData };
    },

    onSuccess: (serverMessage, { channelId }) => {
      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.id === serverMessage.id ? serverMessage : msg
            ),
          })),
        };
      });
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
