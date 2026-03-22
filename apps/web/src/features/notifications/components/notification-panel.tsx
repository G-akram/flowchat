import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../api/use-notifications';
import {
  useMarkNotificationRead,
  useDeleteNotification,
  useMarkAllRead,
  useClearAllNotifications,
} from '../api/use-notification-actions';
import type { Notification } from '../types';

const TYPE_ICONS: Record<Notification['type'], { icon: string; color: string }> = {
  channel_invited: { icon: '#', color: 'bg-blue-500/15 text-blue-600' },
  channel_removed: { icon: '#', color: 'bg-red-500/15 text-red-600' },
  workspace_invited: { icon: 'W', color: 'bg-emerald-500/15 text-emerald-600' },
  workspace_removed: { icon: 'W', color: 'bg-red-500/15 text-red-600' },
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Notification;
  onNavigate: () => void;
}): React.JSX.Element {
  const navigate = useNavigate();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const typeInfo = TYPE_ICONS[notification.type];

  function handleClick(): void {
    if (!notification.isRead) {
      markRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onNavigate();
    }
  }

  function handleDismiss(e: React.MouseEvent): void {
    e.stopPropagation();
    deleteNotification(notification.id);
  }

  const hasAction = Boolean(notification.actionUrl);

  return (
    <div
      className={`group relative flex gap-3 px-4 py-3 transition-colors ${
        hasAction ? 'cursor-pointer hover:bg-accent' : ''
      } ${notification.isRead ? 'opacity-70' : ''}`}
      onClick={hasAction ? handleClick : undefined}
      role={hasAction ? 'button' : undefined}
      tabIndex={hasAction ? 0 : undefined}
      onKeyDown={hasAction ? (e) => { if (e.key === 'Enter') handleClick(); } : undefined}
    >
      {!notification.isRead && (
        <span className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-500" />
      )}

      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${typeInfo.color}`}>
        {typeInfo.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
      </div>

      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
        title="Dismiss"
        onClick={handleDismiss}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function NotificationPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading } = useNotifications();
  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: clearAll } = useClearAllNotifications();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent): void {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-popover-foreground">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
              onClick={() => markAllRead()}
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              onClick={() => clearAll()}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <svg className="mx-auto h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
