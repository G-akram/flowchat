import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/api/use-logout';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { useChannels } from '@/features/channels/api/use-channels';
import { useDirectMessages } from '@/features/dm/api/use-direct-messages';
import { useNotifications } from '@/features/notifications/api/use-notifications';
import { NotificationPanel } from '@/features/notifications/components/notification-panel';
import { Button } from '@flowchat/ui';
import { PresenceDot } from '@/components/presence-dot';
import { useUiStore } from '@/stores/ui-store';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChannelItem } from '@/components/channel-item';
import { WorkspaceMenu } from '@/components/workspace-menu';

function ChannelListSkeleton(): React.JSX.Element {
  return (
    <div className="mt-2 space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-7 animate-pulse rounded bg-sidebar-accent"
        />
      ))}
    </div>
  );
}

function ChannelListEmpty(): React.JSX.Element {
  return (
    <p className="mt-2 text-xs text-sidebar-muted-foreground">No channels yet</p>
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
  const { unreadCount } = useNotifications();
  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
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

    return (): void => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWsMenuOpen]);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="relative flex h-12 items-center justify-between border-b border-sidebar-border px-4" ref={wsMenuRef}>
        <button
          type="button"
          className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 hover:bg-sidebar-accent"
          onClick={() => setIsWsMenuOpen((prev) => !prev)}
        >
          <span className="truncate text-sm font-semibold text-sidebar-foreground">
            {isLoadingWorkspaces ? 'Loading\u2026' : (activeWorkspace?.name ?? 'FlowChat')}
          </span>
          <svg className="h-3.5 w-3.5 shrink-0 text-sidebar-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-0.5">
          <div className="relative">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="Notifications"
              onClick={() => setIsNotifOpen((prev) => !prev)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Search messages (Ctrl+K)"
            onClick={() => openModal('search')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        {isWsMenuOpen && <WorkspaceMenu onClose={() => setIsWsMenuOpen(false)} />}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-sidebar-muted-foreground">
            Channels
          </p>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
            {channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === channelId}
                workspaceId={workspaceId ?? ''}
              />
            ))}
          </nav>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-sidebar-muted-foreground">
            Direct Messages
          </p>
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="New direct message"
            onClick={() => openModal('newDm')}
          >
            <span className="text-sm leading-none">+</span>
          </button>
        </div>

        {isLoadingDms ? (
          <ChannelListSkeleton />
        ) : !dms || dms.length === 0 ? (
          <p className="mt-2 text-xs text-sidebar-muted-foreground">No conversations yet</p>
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
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
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

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded px-1 py-0.5 hover:bg-sidebar-accent"
            onClick={() => openModal('editProfile')}
          >
            {user && <PresenceDot userId={user.id} size="sm" />}
            <span className="truncate text-sm text-sidebar-foreground">
              {user?.displayName}
            </span>
          </button>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
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
      </div>
    </aside>
  );
}
