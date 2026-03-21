import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { SOCKET_EVENTS, TYPING_TIMEOUT_MS } from '@/features/messages/constants';
import { messagesQueryKey } from '@/features/messages/api/use-messages';
import type { MessageWithUser } from '@/features/messages/types';

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

interface TypingPayload {
  channelId: string;
  userId: string;
  displayName: string;
}

interface TypingUser {
  userId: string;
  displayName: string;
}

interface UseChannelSocketReturn {
  typingUsers: TypingUser[];
  newMessageFlag: boolean;
  clearNewMessageFlag: () => void;
}

export function useChannelSocket(channelId: string | undefined): UseChannelSocketReturn {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [newMessageFlag, setNewMessageFlag] = useState(false);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearNewMessageFlag = useCallback((): void => {
    setNewMessageFlag(false);
  }, []);

  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();

    function joinChannel(): void {
      socket.emit(SOCKET_EVENTS.CHANNEL_JOIN, channelId);
    }

    if (socket.connected) {
      joinChannel();
    } else {
      connectSocket();
      socket.once('connect', joinChannel);
    }

    function handleNewMessage(message: MessageWithUser): void {
      if (message.channelId !== channelId) return;
      if (message.user.id === currentUserId) return;

      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) {
          return {
            pages: [{ data: [message], nextCursor: null }],
            pageParams: [undefined],
          };
        }

        const allMessages = old.pages.flatMap((p) => p.data);
        const alreadyExists = allMessages.some((m) => m.id === message.id);
        if (alreadyExists) return old;

        const newPages = [...old.pages];
        const firstPage = newPages[0];
        if (firstPage) {
          newPages[0] = {
            ...firstPage,
            data: [message, ...firstPage.data],
          };
        }

        return { ...old, pages: newPages };
      });

      if (message.user.id !== currentUserId) {
        setNewMessageFlag(true);
      }
    }

    function handleUpdatedMessage(message: Partial<MessageWithUser> & { id: string; channelId: string }): void {
      if (message.channelId !== channelId) return;

      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) => {
              if (msg.id !== message.id) return msg;
              return { ...msg, ...message };
            }),
          })),
        };
      });
    }

    function handleDeletedMessage(payload: { id: string; channelId: string }): void {
      if (payload.channelId !== channelId) return;

      const key = messagesQueryKey(channelId);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((msg) => msg.id !== payload.id),
          })),
        };
      });
    }

    function handleTypingStart(payload: TypingPayload): void {
      if (payload.channelId !== channelId) return;
      if (payload.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const exists = prev.some((u) => u.userId === payload.userId);
        if (exists) return prev;
        return [...prev, { userId: payload.userId, displayName: payload.displayName }];
      });

      const existingTimer = typingTimers.current.get(payload.userId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
        typingTimers.current.delete(payload.userId);
      }, TYPING_TIMEOUT_MS);

      typingTimers.current.set(payload.userId, timer);
    }

    function handleTypingStop(payload: TypingPayload): void {
      if (payload.channelId !== channelId) return;
      if (payload.userId === currentUserId) return;

      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));

      const existingTimer = typingTimers.current.get(payload.userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingTimers.current.delete(payload.userId);
      }
    }

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleUpdatedMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleDeletedMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

    return () => {
      socket.off('connect', joinChannel);
      socket.emit(SOCKET_EVENTS.CHANNEL_LEAVE, channelId);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleUpdatedMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleDeletedMessage);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
      setTypingUsers([]);
    };
  }, [channelId, currentUserId, queryClient]);

  return { typingUsers, newMessageFlag, clearNewMessageFlag };
}
