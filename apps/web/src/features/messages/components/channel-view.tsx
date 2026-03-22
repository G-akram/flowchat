import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useChannelSocket } from '@/hooks/use-channel-socket';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { useOpenDm } from '@/features/dm/api/use-open-dm';
import { useChannels } from '@/features/channels/api/use-channels';
import { useDeleteChannel } from '@/features/channels/api/use-delete-channel';
import { useLeaveChannel } from '@/features/channels/api/use-leave-channel';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
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

function ChannelHeaderMenu({
  channelId,
  channelName,
  channelDescription,
  isGeneral,
  canManage,
}: {
  channelId: string;
  channelName: string;
  channelDescription: string | null;
  isGeneral: boolean;
  canManage: boolean;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const openModal = useUiStore((s) => s.openModal);

  const { mutate: deleteChannel } = useDeleteChannel({
    onSuccess: () => {
      if (workspaceId) navigate(`/app/${workspaceId}`);
    },
  });

  const { mutate: leaveChannel } = useLeaveChannel({
    onSuccess: () => {
      if (workspaceId) navigate(`/app/${workspaceId}`);
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Channel options"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setIsOpen(false);
              openModal('addChannelMembers', {
                channelId,
                channelName,
              });
            }}
          >
            Add members
          </button>
          {canManage && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setIsOpen(false);
                openModal('editChannel', {
                  channelId,
                  channelName,
                  channelDescription: channelDescription,
                });
              }}
            >
              Edit channel
            </button>
          )}
          {!isGeneral && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setIsOpen(false);
                if (workspaceId) {
                  leaveChannel({ workspaceId, channelId });
                }
              }}
            >
              Leave channel
            </button>
          )}
          {canManage && !isGeneral && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setIsOpen(false);
                if (workspaceId && window.confirm(`Delete #${channelName}? This cannot be undone.`)) {
                  deleteChannel({ workspaceId, channelId });
                }
              }}
            >
              Delete channel
            </button>
          )}
        </div>
      )}
    </div>
  );
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
        navigate(`/app/${workspaceId}/${dm.id}`);
      } catch {
        // silently ignore — user will see no navigation
      }
    },
    [workspaceId, currentUser, openDm, navigate]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-gray-900">
            {isDm ? '' : '# '}{channelName ?? (isDm ? 'Direct Message' : 'channel')}
          </h2>
          {!isDm && channel?.description && (
            <p className="truncate text-xs text-gray-400">{channel.description}</p>
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
      />

      <TypingIndicator typingUsers={typingUsers} />

      <MessageInput channelId={channelId} />
    </div>
  );
}
