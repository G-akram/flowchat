import React, { useState, useCallback, useMemo } from 'react';
import { Avatar, Button } from '@flowchat/ui';
import { PresenceDot } from '@/components/presence-dot';
import type { DisplayMessage } from '../types';
import { isOptimisticMessage } from '../types';
import { ReactionBar } from './reaction-bar';
import { EmojiPicker } from './emoji-picker';
import { MessageAttachments } from '@/features/uploads/components/message-attachments';

interface MessageItemProps {
  message: DisplayMessage;
  isCompact: boolean;
  onRetry: ((tempId: string, content: string) => void) | undefined;
  onRemoveFailed: ((tempId: string) => void) | undefined;
  onToggleReaction: (messageId: string, emoji: string, hasReacted: boolean) => void;
  onUserClick?: ((userId: string) => void) | undefined;
  isHighlighted?: boolean | undefined;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const MessageItem = React.memo(function MessageItem({
  message,
  isCompact,
  onRetry,
  onRemoveFailed,
  onToggleReaction,
  onUserClick,
  isHighlighted = false,
}: MessageItemProps): React.JSX.Element {
  const isFailed = isOptimisticMessage(message) && message.status === 'failed';
  const isSending = isOptimisticMessage(message) && message.status === 'sending';
  const isOptimistic = isOptimisticMessage(message);
  const [showPicker, setShowPicker] = useState(false);

  const reactions = useMemo(() => message.reactions ?? [], [message.reactions]);
  const hasReactions = reactions.length > 0;

  const handleToggle = useCallback(
    (emoji: string, hasReacted: boolean): void => {
      onToggleReaction(message.id, emoji, hasReacted);
    },
    [message.id, onToggleReaction]
  );

  const handlePickerSelect = useCallback(
    (emoji: string): void => {
      const existing = reactions.find((r) => r.emoji === emoji);
      onToggleReaction(message.id, emoji, existing?.hasReacted ?? false);
    },
    [message.id, reactions, onToggleReaction]
  );

  const addButton = !isOptimistic && (
    <button
      type="button"
      className="invisible absolute -top-3 right-2 z-10 inline-flex h-6 items-center gap-1 rounded border border-border bg-popover px-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:border-border hover:text-foreground group-hover/msg:visible"
      onClick={() => setShowPicker((prev) => !prev)}
    >
      <span className="text-sm leading-none">😀</span>
      <span className="leading-none">+</span>
    </button>
  );

  const picker = showPicker && (
    <EmojiPicker
      onSelect={handlePickerSelect}
      onClose={() => setShowPicker(false)}
    />
  );

  const highlightClass = isHighlighted ? 'bg-yellow-500/15 transition-colors duration-1000' : '';

  if (isCompact) {
    return (
      <div
        id={`message-${message.id}`}
        className={`group/msg relative flex items-start gap-3 px-4 py-0.5 hover:bg-accent/50 ${isFailed ? 'bg-destructive/10' : ''} ${highlightClass}`}
      >
        {addButton}
        {picker}

        <div className="w-8 shrink-0 pt-0.5 text-center">
          <span className="invisible text-xs text-muted-foreground group-hover/msg:visible">
            {formatTime(message.createdAt)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm text-foreground break-words ${isSending ? 'opacity-50' : ''}`}
          >
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments attachments={message.attachments} />
          )}
          {isFailed && (
            <FailedActions
              tempId={(message as { tempId: string }).tempId}
              content={message.content}
              onRetry={onRetry}
              onRemove={onRemoveFailed}
            />
          )}
          {hasReactions && (
            <ReactionBar reactions={reactions} onToggle={handleToggle} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`group/msg relative flex items-start gap-3 px-4 pt-2 pb-1 hover:bg-accent/50 ${isFailed ? 'bg-destructive/10' : ''} ${highlightClass}`}
    >
      {addButton}
      {picker}

      <button
        type="button"
        className="relative shrink-0 pt-0.5 cursor-pointer"
        onClick={() => onUserClick?.(message.user.id)}
        title={`Message ${message.user.displayName}`}
      >
        <Avatar
          src={message.user.avatarUrl}
          alt={message.user.displayName}
          size="sm"
        />
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot userId={message.user.id} size="sm" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {message.user.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        <p
          className={`text-sm text-foreground break-words ${isSending ? 'opacity-50' : ''}`}
        >
          {message.content}
        </p>

        {message.attachments && message.attachments.length > 0 && (
          <MessageAttachments attachments={message.attachments} />
        )}

        {isFailed && (
          <FailedActions
            tempId={(message as { tempId: string }).tempId}
            content={message.content}
            onRetry={onRetry}
            onRemove={onRemoveFailed}
          />
        )}

        {hasReactions && (
          <ReactionBar reactions={reactions} onToggle={handleToggle} />
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

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
      <span className="text-xs text-destructive">Failed to send</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0 text-xs text-destructive hover:text-destructive"
          onClick={() => onRetry(tempId, content)}
        >
          Retry
        </Button>
      )}
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onRemove(tempId)}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
