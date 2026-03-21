import React from 'react';
import { Avatar, Button } from '@flowchat/ui';
import type { DisplayMessage } from '../types';
import { isOptimisticMessage } from '../types';

interface MessageItemProps {
  message: DisplayMessage;
  isCompact: boolean;
  onRetry?: (tempId: string, content: string) => void;
  onRemoveFailed?: (tempId: string) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function MessageItem({
  message,
  isCompact,
  onRetry,
  onRemoveFailed,
}: MessageItemProps): React.JSX.Element {
  const isFailed = isOptimisticMessage(message) && message.status === 'failed';
  const isSending = isOptimisticMessage(message) && message.status === 'sending';

  if (isCompact) {
    return (
      <div
        className={`group flex items-start gap-3 px-4 py-0.5 hover:bg-gray-50 ${isFailed ? 'bg-red-50' : ''}`}
      >
        <div className="w-8 shrink-0 pt-0.5 text-center">
          <span className="hidden text-xs text-gray-400 group-hover:inline">
            {formatTime(message.createdAt)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm text-gray-900 break-words ${isSending ? 'opacity-50' : ''}`}
          >
            {message.content}
          </p>
          {isFailed && (
            <FailedActions
              tempId={(message as { tempId: string }).tempId}
              content={message.content}
              onRetry={onRetry}
              onRemove={onRemoveFailed}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-3 px-4 pt-2 pb-1 hover:bg-gray-50 ${isFailed ? 'bg-red-50' : ''}`}
    >
      <div className="shrink-0 pt-0.5">
        <Avatar
          src={message.user.avatarUrl}
          alt={message.user.displayName}
          size="sm"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {message.user.displayName}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        <p
          className={`text-sm text-gray-900 break-words ${isSending ? 'opacity-50' : ''}`}
        >
          {message.content}
        </p>

        {isFailed && (
          <FailedActions
            tempId={(message as { tempId: string }).tempId}
            content={message.content}
            onRetry={onRetry}
            onRemove={onRemoveFailed}
          />
        )}
      </div>
    </div>
  );
}

interface FailedActionsProps {
  tempId: string;
  content: string;
  onRetry: ((tempId: string, content: string) => void) | undefined;
  onRemove: ((tempId: string) => void) | undefined;
}

function FailedActions({
  tempId,
  content,
  onRetry,
  onRemove,
}: FailedActionsProps): React.JSX.Element {
  return (
    <div className="mt-1 flex items-center gap-2">
      <span className="text-xs text-red-600">Failed to send</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0 text-xs text-red-600 hover:text-red-700"
          onClick={() => onRetry(tempId, content)}
        >
          Retry
        </Button>
      )}
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0 text-xs text-gray-400 hover:text-gray-600"
          onClick={() => onRemove(tempId)}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
