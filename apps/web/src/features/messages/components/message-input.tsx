import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@flowchat/ui';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { useSendMessage } from '../api/use-send-message';
import { SOCKET_EVENTS, TYPING_DEBOUNCE_MS } from '../constants';
import { useFileUpload } from '@/features/uploads/hooks/use-file-upload';
import { FilePreviewList } from '@/features/uploads/components/file-preview-list';

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const { mutate: sendMessage } = useSendMessage();
  const user = useAuthStore((s) => s.user);
  const { pendingUploads, addFiles, removeFile, uploadAll, clearAll, hasFiles } = useFileUpload();

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

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmedContent = content.trim();
    if (!trimmedContent && !hasFiles) return;

    const tempId = generateTempId();
    const messageContent = trimmedContent || ' ';

    if (hasFiles) {
      setIsUploading(true);
      try {
        const uploadResults = await uploadAll();

        sendMessage({
          channelId,
          content: messageContent,
          tempId,
          attachmentKeys: uploadResults.map((r) => ({
            key: r.key,
            fileName: r.fileName,
            mimeType: r.mimeType,
            fileSize: r.fileSize,
          })),
        });

        clearAll();
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage({ channelId, content: messageContent, tempId });
    }

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
  }, [content, channelId, sendMessage, emitTypingStop, hasFiles, uploadAll, clearAll]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
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

  const handleDragOver = useCallback((event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent): void => {
      event.preventDefault();
      setIsDragOver(false);

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        addFiles(files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      if (files.length > 0) {
        addFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  const handlePaperclipClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={`border-t bg-white px-4 py-3 ${isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FilePreviewList uploads={pendingUploads} onRemove={removeFile} />

      <div className="flex items-end gap-2">
        <button
          type="button"
          className="mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onClick={handlePaperclipClick}
          title="Attach file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,application/pdf,text/*"
          onChange={handleFileSelect}
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={isDragOver ? 'Drop files here...' : 'Type a message...'}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-5 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          style={{ minHeight: `${LINE_HEIGHT + PADDING}px` }}
        />
        <Button
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={(!content.trim() && !hasFiles) || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Send'}
        </Button>
      </div>

      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/80">
          <p className="text-sm font-medium text-indigo-600">Drop files to upload</p>
        </div>
      )}
    </div>
  );
}
