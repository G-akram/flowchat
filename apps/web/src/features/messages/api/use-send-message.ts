import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageWithUser } from '../types';
import { messagesQueryKey } from './use-messages';

interface SendMessageVariables {
  channelId: string;
  content: string;
  tempId: string;
}

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<MessageWithUser, Error, SendMessageVariables>({
    mutationFn: async ({ channelId, content }): Promise<MessageWithUser> => {
      const response = await apiClient.post<{ data: { message: MessageWithUser } }>(
        `/channels/${channelId}/messages`,
        { content }
      );
      return response.data.data.message;
    },

    onMutate: async ({ channelId, content, tempId }) => {
      const key = messagesQueryKey(channelId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousData = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      if (user) {
        const optimisticMessage: MessageWithUser & { tempId: string; status: string } = {
          id: tempId,
          tempId,
          channelId,
          content,
          editedAt: null,
          createdAt: new Date().toISOString(),
          status: 'sending',
          user: {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl ?? null,
          },
        };

        queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
          if (!old) {
            return {
              pages: [{ data: [optimisticMessage], nextCursor: null }],
              pageParams: [undefined],
            };
          }

          const newPages = [...old.pages];
          const firstPage = newPages[0];
          if (firstPage) {
            newPages[0] = {
              ...firstPage,
              data: [optimisticMessage, ...firstPage.data],
            };
          }

          return { ...old, pages: newPages };
        });
      }

      return { previousData };
    },

    onSuccess: (serverMessage, { channelId, tempId }) => {
      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.id === tempId ? serverMessage : msg
            ),
          })),
        };
      });
    },

    onError: (_error, { channelId, tempId }, context) => {
      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return (context as { previousData?: InfiniteData<MessagesPage> })?.previousData;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.id === tempId
                ? { ...msg, status: 'failed', tempId } as MessageWithUser & { tempId: string; status: string }
                : msg
            ),
          })),
        };
      });
    },
  });
}
