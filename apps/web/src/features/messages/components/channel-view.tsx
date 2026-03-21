import React, { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useChannelSocket } from '@/hooks/use-channel-socket';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { useSendMessage } from '../api/use-send-message';
import { useToggleReaction } from '../api/use-toggle-reaction';
import { messagesQueryKey } from '../api/use-messages';
import type { MessageWithUser } from '../types';

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

interface ChannelViewProps {
  channelId: string;
  channelName?: string;
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChannelView({ channelId, channelName }: ChannelViewProps): React.JSX.Element {
  const { typingUsers, newMessageFlag, clearNewMessageFlag } = useChannelSocket(channelId);
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: toggleReaction } = useToggleReaction();
  const queryClient = useQueryClient();

  const handleRetry = useCallback(
    (failedTempId: string, content: string): void => {
      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((msg) => msg.id !== failedTempId),
          })),
        };
      });

      const newTempId = generateTempId();
      sendMessage({ channelId, content, tempId: newTempId });
    },
    [channelId, sendMessage, queryClient]
  );

  const handleRemoveFailed = useCallback(
    (failedTempId: string): void => {
      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((msg) => msg.id !== failedTempId),
          })),
        };
      });
    },
    [channelId, queryClient]
  );

  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string, hasReacted: boolean): void => {
      toggleReaction({ messageId, channelId, emoji, hasReacted });
    },
    [channelId, toggleReaction]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-gray-200 px-4">
        <h2 className="text-sm font-semibold text-gray-900">
          # {channelName ?? 'channel'}
        </h2>
      </div>

      <MessageList
        channelId={channelId}
        newMessageFlag={newMessageFlag}
        onClearNewMessageFlag={clearNewMessageFlag}
        onRetry={handleRetry}
        onRemoveFailed={handleRemoveFailed}
        onToggleReaction={handleToggleReaction}
      />

      <TypingIndicator typingUsers={typingUsers} />

      <MessageInput channelId={channelId} />
    </div>
  );
}
