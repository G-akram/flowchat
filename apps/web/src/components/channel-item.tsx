import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChannelContextMenu } from '@/components/channel-context-menu';
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

  return (
    <div className="group relative">
      <Link
        to={`/app/${workspaceId}/${channel.id}`}
        className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
          isActive
            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        }`}
      >
        <span className="min-w-0 truncate">
          <span className="mr-1 text-sidebar-muted-foreground">#</span>
          {channel.name}
        </span>
        <button
          type="button"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground ${
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
