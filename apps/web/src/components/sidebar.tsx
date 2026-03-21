import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/api/use-logout';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { useChannels } from '@/features/channels/api/use-channels';
import { Button } from '@flowchat/ui';

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
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { channels, isLoading: isLoadingChannels } = useChannels(workspaceId);

  const activeWorkspace = workspaces?.find((w) => w.id === workspaceId);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
        <span className="truncate text-sm font-semibold text-gray-900">
          {isLoadingWorkspaces ? 'Loading…' : (activeWorkspace?.name ?? 'FlowChat')}
        </span>
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
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm text-gray-700">
            {user?.displayName}
          </span>
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
