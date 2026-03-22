import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageWithUser } from '../types';
import { messagesQueryKey } from './use-messages';

interface SendMessageVariables {
  channelId: string;
  content: string;
  tempId: string;
  attachmentKeys?: Array<{
    key: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }>;
}

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<MessageWithUser, Error, SendMessageVariables>({
    mutationFn: async ({ channelId, content, attachmentKeys }): Promise<MessageWithUser> => {
      const body: Record<string, unknown> = { content };
      if (attachmentKeys && attachmentKeys.length > 0) {
        body['attachments'] = attachmentKeys;
      }
      const response = await apiClient.post<{ data: { message: MessageWithUser } }>(
        `/channels/${channelId}/messages`,
        body
      );
      return response.data.data.message;
    },

    onMutate: async ({ channelId, content, tempId, attachmentKeys }) => {
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
          reactions: [],
          attachments: (attachmentKeys ?? []).map((a, idx) => ({
            id: `temp-att-${idx}`,
            url: '',
            fileName: a.fileName,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
          })),
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

      toast.error('Failed to send message', {
        description: 'Your message could not be delivered. You can retry from the message.',
      });
    },
  });
}
