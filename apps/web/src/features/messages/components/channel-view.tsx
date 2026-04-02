import React, { useCallback, useState, useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useChannelSocket } from '@/hooks/use-channel-socket';
import { useAuthStore } from '@/stores/auth-store';
import { useOpenDm } from '@/features/dm/api/use-open-dm';
import { useChannels } from '@/features/channels/api/use-channels';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ChannelHeaderMenu } from './channel-header-menu';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { useSendMessage } from '../api/use-send-message';
import { useEditMessage } from '../api/use-edit-message';
import { useDeleteMessage } from '../api/use-delete-message';
import { useToggleReaction } from '../api/use-toggle-reaction';
import { messagesQueryKey } from '../api/use-messages';
import { useMarkChannelRead } from '@/features/channels/api/use-mark-channel-read';
import { useUnreadStore } from '@/stores/unread-store';
import type { MessageWithUser } from '../types';

interface MessagesPage {
  data: MessageWithUser[];
  nextCursor: string | null;
}

interface ChannelViewProps {
  channelId: string;
  channelName?: string | undefined;
  isDm?: boolean | undefined;
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChannelView({ channelId, channelName, isDm = false }: ChannelViewProps): React.JSX.Element {
  const { typingUsers, newMessageFlag, clearNewMessageFlag } = useChannelSocket(channelId);
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: editMessage } = useEditMessage();
  const { mutate: deleteMessage, isPending: isDeleting } = useDeleteMessage();
  const { mutate: toggleReaction } = useToggleReaction();
  const { mutate: markChannelRead } = useMarkChannelRead();
  const clearUnread = useUnreadStore((s) => s.clearUnread);
  const queryClient = useQueryClient();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { mutateAsync: openDm } = useOpenDm();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightMessageId = searchParams.get('highlight') ?? undefined;
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const { channels } = useChannels(workspaceId);
  const { workspaces } = useWorkspaces();
  const channel = channels?.find((c) => c.id === channelId);
  const workspace = workspaces?.find((w) => w.id === workspaceId);
  const isOwnerOrAdmin = workspace?.ownerId === currentUser?.id;
  const isChannelCreator = channel?.createdById === currentUser?.id;
  const canManage = isOwnerOrAdmin || isChannelCreator;
  const isGeneral = channel?.name === 'general';

  useEffect(() => {
    if (!workspaceId) return;
    markChannelRead({ workspaceId, channelId });
    clearUnread(channelId);
  }, [channelId, workspaceId, markChannelRead, clearUnread]);

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

  const handleEditSave = useCallback(
    (messageId: string, content: string): void => {
      editMessage({ channelId, messageId, content });
    },
    [channelId, editMessage]
  );

  const handleDeleteRequest = useCallback((messageId: string): void => {
    setDeletingMessageId(messageId);
  }, []);

  const handleDeleteConfirm = useCallback((): void => {
    if (!deletingMessageId) return;
    deleteMessage(
      { channelId, messageId: deletingMessageId },
      { onSettled: () => setDeletingMessageId(null) }
    );
  }, [channelId, deletingMessageId, deleteMessage]);

  const handleUserClick = useCallback(
    async (userId: string): Promise<void> => {
      if (!workspaceId || !currentUser || userId === currentUser.id) return;

      try {
        const dm = await openDm({ workspaceId, userId });
        void navigate(`/app/${workspaceId}/${dm.id}`);
      } catch {
        // silently ignore — user will see no navigation
      }
    },
    [workspaceId, currentUser, openDm, navigate]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold text-foreground">
            {isDm ? '' : <span className="mr-0.5 font-normal text-muted-foreground">#</span>}{channelName ?? (isDm ? 'Direct Message' : 'channel')}
          </h2>
          {!isDm && channel?.description && (
            <p className="truncate text-xs text-muted-foreground">{channel.description}</p>
          )}
        </div>
        {!isDm && channel && (
          <ChannelHeaderMenu
            channelId={channelId}
            channelName={channel.name}
            channelDescription={channel.description}
            isGeneral={isGeneral}
            canManage={canManage}
          />
        )}
      </div>

      <MessageList
        channelId={channelId}
        newMessageFlag={newMessageFlag}
        onClearNewMessageFlag={clearNewMessageFlag}
        onRetry={handleRetry}
        onRemoveFailed={handleRemoveFailed}
        onToggleReaction={handleToggleReaction}
        onUserClick={handleUserClick}
        highlightMessageId={highlightMessageId}
        onHighlightComplete={(): void => {
          setSearchParams({}, { replace: true });
        }}
        isDm={isDm}
        currentUserId={currentUser?.id}
        onEditSave={handleEditSave}
        onDelete={handleDeleteRequest}
      />

      <TypingIndicator typingUsers={typingUsers} />

      <MessageInput channelId={channelId} />

      <ConfirmDialog
        open={deletingMessageId !== null}
        title="Delete message"
        message="This message will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMessageId(null)}
      />
    </div>
  );
}
