import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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

function WorkspaceMenu({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const openModal = useUiStore((s) => s.openModal);
  const { workspaces } = useWorkspaces();

  const otherWorkspaces = workspaces?.filter((w) => w.id !== workspaceId) ?? [];

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        onClick={() => {
          onClose();
          openModal('workspaceSettings');
        }}
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        onClick={() => {
          onClose();
          openModal('inviteMembers');
        }}
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Invite people
      </button>

      {otherWorkspaces.length > 0 && (
        <>
          <div className="my-1 border-t border-gray-100" />
          <p className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Switch workspace
          </p>
          {otherWorkspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                onClose();
                navigate(`/app/${ws.id}`);
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600">
                {ws.name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
        </>
      )}

      <div className="my-1 border-t border-gray-100" />
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        onClick={() => {
          onClose();
          openModal('createWorkspace');
        }}
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create workspace
      </button>
    </div>
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
  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);
  const wsMenuRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces?.find((w) => w.id === workspaceId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)) {
        setIsWsMenuOpen(false);
      }
    }

    if (isWsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWsMenuOpen]);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <div className="relative flex h-12 items-center justify-between border-b border-gray-200 px-4" ref={wsMenuRef}>
        <button
          type="button"
          className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-200"
          onClick={() => setIsWsMenuOpen((prev) => !prev)}
        >
          <span className="truncate text-sm font-semibold text-gray-900">
            {isLoadingWorkspaces ? 'Loading\u2026' : (activeWorkspace?.name ?? 'FlowChat')}
          </span>
          <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
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
        {isWsMenuOpen && <WorkspaceMenu onClose={() => setIsWsMenuOpen(false)} />}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Channels
          </p>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            title="Create channel"
            onClick={() => openModal('createChannel')}
          >
            <span className="text-sm leading-none">+</span>
          </button>
        </div>

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
