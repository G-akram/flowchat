import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageWithUser, ReactionData } from '../types';
import { messagesQueryKey } from './use-messages';

interface ToggleReactionVariables {
  messageId: string;
  channelId: string;
  emoji: string;
  hasReacted: boolean;
}

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<ReactionData[], Error, ToggleReactionVariables>({
    mutationFn: async ({ messageId, emoji, hasReacted }): Promise<ReactionData[]> => {
      if (hasReacted) {
        const response = await apiClient.delete<{ data: { reactions: ReactionData[] } }>(
          `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
        );
        return response.data.data.reactions;
      }

      const response = await apiClient.post<{ data: { reactions: ReactionData[] } }>(
        `/messages/${messageId}/reactions`,
        { emoji }
      );
      return response.data.data.reactions;
    },

    onMutate: async ({ messageId, channelId, emoji, hasReacted }) => {
      const key = messagesQueryKey(channelId);
      await queryClient.cancelQueries({ queryKey: key });

      const previousData = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) => {
              if (msg.id !== messageId) return msg;

              const reactions = [...(msg.reactions ?? [])];

              if (hasReacted) {
                const idx = reactions.findIndex((r) => r.emoji === emoji);
                if (idx !== -1) {
                  const existing = reactions[idx]!;
                  if (existing.count <= 1) {
                    reactions.splice(idx, 1);
                  } else {
                    reactions[idx] = {
                      ...existing,
                      count: existing.count - 1,
                      hasReacted: false,
                    };
                  }
                }
              } else {
                const idx = reactions.findIndex((r) => r.emoji === emoji);
                if (idx !== -1) {
                  const existing = reactions[idx]!;
                  reactions[idx] = {
                    ...existing,
                    count: existing.count + 1,
                    hasReacted: true,
                  };
                } else {
                  reactions.push({ emoji, count: 1, hasReacted: true });
                }
              }

              return { ...msg, reactions };
            }),
          })),
        };
      });

      return { previousData };
    },

    onSuccess: (serverReactions, { messageId, channelId }) => {
      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) => {
              if (msg.id !== messageId) return msg;
              return { ...msg, reactions: serverReactions };
            }),
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
