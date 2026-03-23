import React, { useState, useCallback, useMemo } from 'react';
import { Avatar, Button } from '@flowchat/ui';
import { PresenceDot } from '@/components/presence-dot';
import type { DisplayMessage, ReactionData } from '../types';
import { isOptimisticMessage } from '../types';
import { ReactionBar } from './reaction-bar';
import { EmojiPicker } from './emoji-picker';
import { MessageAttachments } from '@/features/uploads/components/message-attachments';
import { MessageActionBar } from './message-action-bar';
import { InlineEditForm } from './inline-edit-form';

interface MessageItemProps {
  message: DisplayMessage;
  isCompact: boolean;
  onRetry: ((tempId: string, content: string) => void) | undefined;
  onRemoveFailed: ((tempId: string) => void) | undefined;
  onToggleReaction: (messageId: string, emoji: string, hasReacted: boolean) => void;
  onUserClick?: ((userId: string) => void) | undefined;
  isHighlighted?: boolean | undefined;
  isDm?: boolean | undefined;
  currentUserId?: string | undefined;
  onEditSave?: ((messageId: string, content: string) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
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
  isDm = false,
  currentUserId,
  onEditSave,
  onDelete,
}: MessageItemProps): React.JSX.Element {
  const isFailed = isOptimisticMessage(message) && message.status === 'failed';
  const isSending = isOptimisticMessage(message) && message.status === 'sending';
  const isOptimistic = isOptimisticMessage(message);
  const isSelf = isDm && message.user.id === currentUserId;
  const canEdit = !isOptimistic && message.user.id === currentUserId;

  const [showPicker, setShowPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleEditSave = useCallback(
    (content: string): void => {
      onEditSave?.(message.id, content);
      setIsEditing(false);
    },
    [message.id, onEditSave]
  );

  const handleDeleteClick = useCallback((): void => {
    onDelete?.(message.id);
  }, [message.id, onDelete]);

  const highlightClass = isHighlighted ? 'bg-yellow-500/15 transition-colors duration-1000' : '';

  const sharedProps: InternalProps = {
    message,
    isCompact,
    isSending,
    isFailed,
    isOptimistic,
    highlightClass,
    reactions,
    hasReactions,
    canEdit,
    isEditing,
    showPicker,
    onSetShowPicker: setShowPicker,
    onUserClick,
    onToggle: handleToggle,
    onPickerSelect: handlePickerSelect,
    onEditStart: () => setIsEditing(true),
    onEditSave: handleEditSave,
    onEditCancel: () => setIsEditing(false),
    onDeleteClick: handleDeleteClick,
    onRetry,
    onRemoveFailed,
  };

  if (isDm) {
    return <DmMessageItem {...sharedProps} isSelf={isSelf} />;
  }

  return <ChannelMessageItem {...sharedProps} />;
});

MessageItem.displayName = 'MessageItem';

interface InternalProps {
  message: DisplayMessage;
  isCompact: boolean;
  isSending: boolean;
  isFailed: boolean;
  isOptimistic: boolean;
  highlightClass: string;
  reactions: ReactionData[];
  hasReactions: boolean;
  canEdit: boolean;
  isEditing: boolean;
  showPicker: boolean;
  onSetShowPicker: React.Dispatch<React.SetStateAction<boolean>>;
  onUserClick?: ((userId: string) => void) | undefined;
  onToggle: (emoji: string, hasReacted: boolean) => void;
  onPickerSelect: (emoji: string) => void;
  onEditStart: () => void;
  onEditSave: (content: string) => void;
  onEditCancel: () => void;
  onDeleteClick: () => void;
  onRetry: ((tempId: string, content: string) => void) | undefined;
  onRemoveFailed: ((tempId: string) => void) | undefined;
}

interface DmInternalProps extends InternalProps {
  isSelf: boolean;
}

function ChannelMessageItem({
  message,
  isCompact,
  isSending,
  isFailed,
  isOptimistic,
  highlightClass,
  reactions,
  hasReactions,
  canEdit,
  isEditing,
  showPicker,
  onSetShowPicker,
  onUserClick,
  onToggle,
  onPickerSelect,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDeleteClick,
  onRetry,
  onRemoveFailed,
}: InternalProps): React.JSX.Element {
  const actionBar = !isOptimistic && !isEditing && (
    <MessageActionBar
      canEdit={canEdit}
      alignLeft={false}
      onReactionClick={() => onSetShowPicker((p) => !p)}
      onEditClick={onEditStart}
      onDeleteClick={onDeleteClick}
    />
  );

  const picker = showPicker && (
    <EmojiPicker onSelect={onPickerSelect} onClose={() => onSetShowPicker(false)} />
  );

  if (isCompact) {
    return (
      <div
        id={`message-${message.id}`}
        className={`group/msg flex items-start gap-3 px-4 py-0.5 hover:bg-accent/50 ${isFailed ? 'bg-destructive/10' : ''} ${highlightClass}`}
      >
        <div className="w-8 shrink-0 pt-0.5 text-center">
          <span className="invisible text-xs text-muted-foreground group-hover/msg:visible">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="relative min-w-0 flex-1">
          {actionBar}
          {picker}
          {isEditing ? (
            <InlineEditForm
              initialContent={message.content}
              onSave={onEditSave}
              onCancel={onEditCancel}
            />
          ) : (
            <p className={`text-sm text-foreground break-words ${isSending ? 'opacity-50' : ''}`}>
              {message.content}
            </p>
          )}
          {!isEditing && message.attachments && message.attachments.length > 0 && (
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
          {hasReactions && <ReactionBar reactions={reactions} onToggle={onToggle} />}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`group/msg flex items-start gap-3 px-4 pt-2 pb-1 hover:bg-accent/50 ${isFailed ? 'bg-destructive/10' : ''} ${highlightClass}`}
    >
      <button
        type="button"
        className="relative shrink-0 pt-0.5 cursor-pointer"
        onClick={() => onUserClick?.(message.user.id)}
        title={`Message ${message.user.displayName}`}
      >
        <Avatar src={message.user.avatarUrl} alt={message.user.displayName} size="sm" />
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot userId={message.user.id} size="sm" />
        </span>
      </button>

      <div className="relative min-w-0 flex-1">
        {actionBar}
        {picker}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{message.user.displayName}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
          {message.editedAt && !isEditing && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        {isEditing ? (
          <InlineEditForm
            initialContent={message.content}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        ) : (
          <p className={`text-sm text-foreground break-words ${isSending ? 'opacity-50' : ''}`}>
            {message.content}
          </p>
        )}
        {!isEditing && message.attachments && message.attachments.length > 0 && (
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
        {hasReactions && <ReactionBar reactions={reactions} onToggle={onToggle} />}
      </div>
    </div>
  );
}

function DmMessageItem({
  message,
  isCompact,
  isSelf,
  isSending,
  isFailed,
  isOptimistic,
  highlightClass,
  reactions,
  hasReactions,
  canEdit,
  isEditing,
  showPicker,
  onSetShowPicker,
  onUserClick,
  onToggle,
  onPickerSelect,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDeleteClick,
  onRetry,
  onRemoveFailed,
}: DmInternalProps): React.JSX.Element {
  const actionBar = !isOptimistic && !isEditing && (
    <MessageActionBar
      canEdit={canEdit}
      alignLeft={isSelf}
      onReactionClick={() => onSetShowPicker((p) => !p)}
      onEditClick={onEditStart}
      onDeleteClick={onDeleteClick}
    />
  );

  const picker = showPicker && (
    <EmojiPicker
      onSelect={onPickerSelect}
      onClose={() => onSetShowPicker(false)}
      alignLeft={isSelf}
    />
  );

  const bubbleClass = isSelf
    ? 'rounded-2xl rounded-tr-sm bg-primary px-3 py-2'
    : 'rounded-2xl rounded-tl-sm bg-muted px-3 py-2';

  const textClass = isSelf
    ? `text-sm text-primary-foreground break-words ${isSending ? 'opacity-60' : ''}`
    : `text-sm text-foreground break-words ${isSending ? 'opacity-50' : ''}`;

  const rowClass = isSelf ? 'flex-row-reverse' : 'flex-row';

  if (isCompact) {
    return (
      <div
        id={`message-${message.id}`}
        className={`group/msg flex ${rowClass} items-end gap-3 px-4 py-0.5 hover:bg-accent/50 ${isFailed ? 'bg-destructive/10' : ''} ${highlightClass}`}
      >
        <div className="w-8 shrink-0" />
        <div className="relative min-w-0 max-w-[75%]">
          {actionBar}
          {picker}
          <div className={bubbleClass}>
            {isEditing ? (
              <InlineEditForm
                initialContent={message.content}
                onSave={onEditSave}
                onCancel={onEditCancel}
              />
            ) : (
              <p className={textClass}>{message.content}</p>
            )}
            {!isEditing && message.attachments && message.attachments.length > 0 && (
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
          </div>
          {hasReactions && <ReactionBar reactions={reactions} onToggle={onToggle} />}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`group/msg flex ${rowClass} items-end gap-3 px-4 pt-2 pb-1 hover:bg-accent/50 ${isFailed ? 'bg-destructive/10' : ''} ${highlightClass}`}
    >
      <button
        type="button"
        className="relative shrink-0 cursor-pointer"
        onClick={() => onUserClick?.(message.user.id)}
        title={`Message ${message.user.displayName}`}
      >
        <Avatar src={message.user.avatarUrl} alt={message.user.displayName} size="sm" />
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot userId={message.user.id} size="sm" />
        </span>
      </button>

      <div className="relative min-w-0 max-w-[75%]">
        {actionBar}
        {picker}
        <div className={`flex items-baseline gap-2 mb-0.5 ${isSelf ? 'justify-end' : ''}`}>
          {!isSelf && (
            <span className="text-sm font-semibold text-foreground">{message.user.displayName}</span>
          )}
          <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
          {message.editedAt && !isEditing && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <div className={bubbleClass}>
          {isEditing ? (
            <InlineEditForm
              initialContent={message.content}
              onSave={onEditSave}
              onCancel={onEditCancel}
            />
          ) : (
            <p className={textClass}>{message.content}</p>
          )}
          {!isEditing && message.attachments && message.attachments.length > 0 && (
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
        </div>
        {hasReactions && <ReactionBar reactions={reactions} onToggle={onToggle} />}
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
