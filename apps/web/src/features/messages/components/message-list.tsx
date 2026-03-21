import React, { useRef, useEffect, useCallback } from 'react';
import { useMessages } from '../api/use-messages';
import { MessageItem } from './message-item';
import type { DisplayMessage } from '../types';

interface MessageListProps {
  channelId: string;
  newMessageFlag: boolean;
  onClearNewMessageFlag: () => void;
  onRetry: (tempId: string, content: string) => void;
  onRemoveFailed: (tempId: string) => void;
}

const SCROLL_THRESHOLD = 150;

function shouldGroup(current: DisplayMessage, previous: DisplayMessage): boolean {
  if (current.user.id !== previous.user.id) return false;

  const currentTime = new Date(current.createdAt).getTime();
  const previousTime = new Date(previous.createdAt).getTime();
  const diffMinutes = Math.abs(currentTime - previousTime) / 60000;

  return diffMinutes < 5;
}

export function MessageList({
  channelId,
  newMessageFlag,
  onClearNewMessageFlag,
  onRetry,
  onRemoveFailed,
}: MessageListProps): React.JSX.Element {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useMessages(channelId);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);
  const previousScrollHeight = useRef(0);

  const messages: DisplayMessage[] = data
    ? data.pages.flatMap((page) => page.data).reverse()
    : [];

  const checkIfNearBottom = useCallback((): boolean => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((): void => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isNearBottom.current) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [channelId, scrollToBottom]);

  useEffect(() => {
    if (!isFetchingNextPage && previousScrollHeight.current > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - previousScrollHeight.current;
        previousScrollHeight.current = 0;
      }
    }
  }, [isFetchingNextPage]);

  const handleScroll = useCallback((): void => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isNearBottom.current = checkIfNearBottom();

    if (isNearBottom.current && newMessageFlag) {
      onClearNewMessageFlag();
    }

    if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      previousScrollHeight.current = container.scrollHeight;
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, checkIfNearBottom, newMessageFlag, onClearNewMessageFlag]);

  const handleNewMessagesClick = useCallback((): void => {
    scrollToBottom();
    onClearNewMessageFlag();
  }, [scrollToBottom, onClearNewMessageFlag]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-red-500">Failed to load messages</div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        {isFetchingNextPage && (
          <div className="py-3 text-center">
            <span className="text-xs text-gray-400">Loading older messages...</span>
          </div>
        )}

        {!hasNextPage && messages.length > 0 && (
          <div className="py-4 text-center">
            <span className="text-xs text-gray-400">Beginning of conversation</span>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">No messages yet. Send the first one!</p>
          </div>
        )}

        <div className="pb-2">
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const isCompact = previousMessage
              ? shouldGroup(message, previousMessage)
              : false;

            return (
              <MessageItem
                key={message.id}
                message={message}
                isCompact={isCompact}
                onRetry={onRetry}
                onRemoveFailed={onRemoveFailed}
              />
            );
          })}
        </div>
      </div>

      {newMessageFlag && !isNearBottom.current && (
        <button
          type="button"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg transition-colors hover:bg-indigo-700"
          onClick={handleNewMessagesClick}
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
}
