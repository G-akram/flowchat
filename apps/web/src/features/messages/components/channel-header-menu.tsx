import React, { useState, useRef, useEffect } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useParams, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/ui-store';
import { useDeleteChannel } from '@/features/channels/api/use-delete-channel';
import { useLeaveChannel } from '@/features/channels/api/use-leave-channel';

interface ChannelHeaderMenuProps {
  channelId: string;
  channelName: string;
  channelDescription: string | null;
  isGeneral: boolean;
  canManage: boolean;
}

export function ChannelHeaderMenu({
  channelId,
  channelName,
  channelDescription,
  isGeneral,
  canManage,
}: ChannelHeaderMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const openModal = useUiStore((s) => s.openModal);

  const { mutate: deleteChannel } = useDeleteChannel({
    onSuccess: () => {
      if (workspaceId) void navigate(`/app/${workspaceId}`);
    },
  });

  const { mutate: leaveChannel } = useLeaveChannel({
    onSuccess: () => {
      if (workspaceId) void navigate(`/app/${workspaceId}`);
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

    return (): void => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Channel options"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-popover py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
            onClick={() => {
              setIsOpen(false);
              openModal('channelMembers', {
                channelId,
                channelName,
              });
            }}
          >
            Members
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => {
                setIsOpen(false);
                setConfirmDeleteOpen(true);
              }}
            >
              Delete channel
            </button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete channel"
        message={`Delete #${channelName}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          if (workspaceId) deleteChannel({ workspaceId, channelId });
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
