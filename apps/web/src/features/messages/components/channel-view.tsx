import React, { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useChannelSocket } from '@/hooks/use-channel-socket';
import { useAuthStore } from '@/stores/auth-store';
import { useOpenDm } from '@/features/dm/api/use-open-dm';
import { useChannels } from '@/features/channels/api/use-channels';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { ChannelHeaderMenu } from './channel-header-menu';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { useSendMessage } from '../api/use-send-message';
import { useToggleReaction } from '../api/use-toggle-reaction';
import { messagesQueryKey } from '../api/use-messages';
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
  const { mutate: toggleReaction } = useToggleReaction();
  const queryClient = useQueryClient();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { mutateAsync: openDm } = useOpenDm();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightMessageId = searchParams.get('highlight') ?? undefined;

  const { channels } = useChannels(workspaceId);
  const { workspaces } = useWorkspaces();
  const channel = channels?.find((c) => c.id === channelId);
  const workspace = workspaces?.find((w) => w.id === workspaceId);
  const isOwnerOrAdmin = workspace?.ownerId === currentUser?.id;
  const isChannelCreator = channel?.createdById === currentUser?.id;
  const canManage = isOwnerOrAdmin || isChannelCreator;
  const isGeneral = channel?.name === 'general';

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
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {isDm ? '' : '# '}{channelName ?? (isDm ? 'Direct Message' : 'channel')}
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
      />

      <TypingIndicator typingUsers={typingUsers} />

      <MessageInput channelId={channelId} />
    </div>
  );
}
