import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/api/use-logout';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { useChannels } from '@/features/channels/api/use-channels';
import { useDirectMessages } from '@/features/dm/api/use-direct-messages';
import { Button } from '@flowchat/ui';
import { PresenceDot } from '@/components/presence-dot';
import { useUiStore } from '@/stores/ui-store';

function ChannelListSkeleton(): React.JSX.Element {
  return (
    <div className="mt-2 space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-7 animate-pulse rounded bg-gray-200"
        />
      ))}
    </div>
  );
}

function ChannelListEmpty(): React.JSX.Element {
  return (
    <p className="mt-2 text-xs text-gray-400">No channels yet</p>
  );
}

export function Sidebar(): React.JSX.Element {
  const { workspaceId, channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();
  const openModal = useUiStore((s) => s.openModal);
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { channels, isLoading: isLoadingChannels } = useChannels(workspaceId);
  const { dms, isLoading: isLoadingDms } = useDirectMessages(workspaceId);

  const activeWorkspace = workspaces?.find((w) => w.id === workspaceId);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
        <span className="truncate text-sm font-semibold text-gray-900">
          {isLoadingWorkspaces ? 'Loading…' : (activeWorkspace?.name ?? 'FlowChat')}
        </span>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          title="Search messages (Ctrl+K)"
          onClick={() => openModal('search')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Channels
        </p>

        {isLoadingChannels ? (
          <ChannelListSkeleton />
        ) : !channels || channels.length === 0 ? (
          <ChannelListEmpty />
        ) : (
          <nav className="mt-2 space-y-0.5">
            {channels.map((channel) => {
              const isActive = channel.id === channelId;
              return (
                <Link
                  key={channel.id}
                  to={`/app/${workspaceId}/${channel.id}`}
                  className={`block rounded px-2 py-1.5 text-sm ${
                    isActive
                      ? 'bg-gray-200 font-medium text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1 text-gray-400">#</span>
                  {channel.name}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Direct Messages
          </p>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            title="New direct message"
            onClick={() => openModal('newDm')}
          >
            <span className="text-sm leading-none">+</span>
          </button>
        </div>

        {isLoadingDms ? (
          <ChannelListSkeleton />
        ) : !dms || dms.length === 0 ? (
          <p className="mt-2 text-xs text-gray-400">No conversations yet</p>
        ) : (
          <nav className="mt-2 space-y-0.5">
            {dms.map((dm) => {
              const isActive = dm.id === channelId;
              return (
                <Link
                  key={dm.id}
                  to={`/app/${workspaceId}/${dm.id}`}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                    isActive
                      ? 'bg-gray-200 font-medium text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <PresenceDot userId={dm.otherUser.id} size="sm" />
                  <span className="truncate">{dm.otherUser.displayName}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100"
            onClick={() => openModal('editProfile')}
          >
            {user && <PresenceDot userId={user.id} size="sm" />}
            <span className="truncate text-sm text-gray-700">
              {user?.displayName}
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            isLoading={isPending}
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
