import { useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { SOCKET_EVENTS, TYPING_DEBOUNCE_MS } from '../constants';

interface UseTypingIndicatorResult {
  emitTypingStart: () => void;
  emitTypingStop: () => void;
  resetTypingTimer: () => void;
  clearTypingState: () => void;
}

export function useTypingIndicator(channelId: string): UseTypingIndicatorResult {
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const user = useAuthStore((s) => s.user);

  const emitTypingStop = useCallback((): void => {
    if (!user || !isTyping.current) return;

    isTyping.current = false;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING_STOP, {
      channelId,
      displayName: user.displayName,
    });
  }, [channelId, user]);

  const emitTypingStart = useCallback((): void => {
    if (!user || isTyping.current) return;

    isTyping.current = true;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING_START, {
      channelId,
      displayName: user.displayName,
    });
  }, [channelId, user]);

  const resetTypingTimer = useCallback((): void => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      emitTypingStop();
    }, TYPING_DEBOUNCE_MS);
  }, [emitTypingStop]);

  const clearTypingState = useCallback((): void => {
    emitTypingStop();
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  }, [emitTypingStop]);

  return { emitTypingStart, emitTypingStop, resetTypingTimer, clearTypingState };
}
