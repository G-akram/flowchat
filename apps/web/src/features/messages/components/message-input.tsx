import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@flowchat/ui';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { useSendMessage } from '../api/use-send-message';
import { SOCKET_EVENTS, TYPING_DEBOUNCE_MS } from '../constants';

interface MessageInputProps {
  channelId: string;
}

const MAX_ROWS = 5;
const LINE_HEIGHT = 20;
const PADDING = 16;

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MessageInput({ channelId }: MessageInputProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const { mutate: sendMessage } = useSendMessage();
  const user = useAuthStore((s) => s.user);

  const emitTypingStart = useCallback((): void => {
    if (!user || isTyping.current) return;

    isTyping.current = true;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING_START, {
      channelId,
      displayName: user.displayName,
    });
  }, [channelId, user]);

  const emitTypingStop = useCallback((): void => {
    if (!user || !isTyping.current) return;

    isTyping.current = false;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING_STOP, {
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

  const resizeTextarea = useCallback((): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_ROWS + PADDING;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const handleSubmit = useCallback((): void => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const tempId = generateTempId();

    sendMessage({ channelId, content: trimmedContent, tempId });

    setContent('');
    emitTypingStop();

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    });
  }, [content, channelId, sendMessage, emitTypingStop]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
      setContent(event.target.value);
      resizeTextarea();
      emitTypingStart();
      resetTypingTimer();
    },
    [resizeTextarea, emitTypingStart, resetTypingTimer]
  );

  const handleBlur = useCallback((): void => {
    emitTypingStop();
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  }, [emitTypingStop]);

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          style={{ minHeight: `${LINE_HEIGHT + PADDING}px` }}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
