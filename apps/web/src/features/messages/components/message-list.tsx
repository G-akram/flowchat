import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, messagesQueryKey } from '../api/use-messages';
import { MessageItem } from './message-item';
import type { DisplayMessage } from '../types';

interface MessageListProps {
  channelId: string;
  newMessageFlag: boolean;
  onClearNewMessageFlag: () => void;
  onRetry: (tempId: string, content: string) => void;
  onRemoveFailed: (tempId: string) => void;
  onToggleReaction: (messageId: string, emoji: string, hasReacted: boolean) => void;
  onUserClick?: ((userId: string) => void) | undefined;
  highlightMessageId?: string | undefined;
  onHighlightComplete?: (() => void) | undefined;
  isDm?: boolean | undefined;
  currentUserId?: string | undefined;
  onEditSave?: ((messageId: string, content: string) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
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
  onToggleReaction,
  onUserClick,
  highlightMessageId,
  onHighlightComplete,
  isDm = false,
  currentUserId,
  onEditSave,
  onDelete,
}: MessageListProps): React.JSX.Element {
  const queryClient = useQueryClient();
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

  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightMessageId || messages.length === 0) return;

    const element = document.getElementById(`message-${highlightMessageId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveHighlight(highlightMessageId);

    const timer = setTimeout(() => {
      setActiveHighlight(null);
      onHighlightComplete?.();
    }, 2000);

    return (): void => {
      clearTimeout(timer);
    };
  }, [highlightMessageId, messages.length, onHighlightComplete]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 animate-pulse rounded bg-muted" style={{ width: `${40 + Math.random() * 50}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive">Failed to load messages</p>
          <button
            type="button"
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: messagesQueryKey(channelId) });
            }}
          >
            Retry
          </button>
        </div>
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
            <span className="text-xs text-muted-foreground">Loading older messages...</span>
          </div>
        )}

        {!hasNextPage && messages.length > 0 && (
          <div className="py-4 text-center">
            <span className="text-xs text-muted-foreground">Beginning of conversation</span>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No messages yet. Send the first one!</p>
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
                onToggleReaction={onToggleReaction}
                onUserClick={onUserClick}
                isHighlighted={activeHighlight === message.id}
                isDm={isDm}
                currentUserId={currentUserId}
                onEditSave={onEditSave}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>

      {newMessageFlag && !isNearBottom.current && (
        <button
          type="button"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          onClick={handleNewMessagesClick}
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
}
