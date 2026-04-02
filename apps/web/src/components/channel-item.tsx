import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChannelContextMenu } from '@/components/channel-context-menu';
import { useUnreadStore } from '@/stores/unread-store';
import type { Channel } from '@flowchat/types';

export function ChannelItem({
  channel,
  isActive,
  workspaceId,
}: {
  channel: Channel;
  isActive: boolean;
  workspaceId: string;
}): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const unreadCount = useUnreadStore((s) => s.counts[channel.id] ?? 0);
  const hasUnread = !isActive && unreadCount > 0;

  return (
    <div className="group relative">
      <Link
        to={`/app/${workspaceId}/${channel.id}`}
        className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
            : hasUnread
              ? 'font-semibold text-sidebar-foreground hover:bg-sidebar-accent/30'
              : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          <span className={`mr-1 ${isActive ? 'text-sidebar-accent-foreground/70' : 'text-sidebar-muted-foreground'}`}>#</span>
          {channel.name}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {hasUnread && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <button
            type="button"
            className={`flex h-5 w-5 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground ${
              isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Channel options"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </Link>
      {isMenuOpen && (
        <ChannelContextMenu
          channel={channel}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
