import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from '@flowchat/ui';
import { useWorkspaceMembers } from '@/features/workspaces/api/use-workspace-members';
import { useOpenDm } from '../api/use-open-dm';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { PresenceDot } from '@/components/presence-dot';

export function NewDmModal(): React.JSX.Element {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { members, isLoading } = useWorkspaceMembers(workspaceId);
  const { mutateAsync: openDm, isPending } = useOpenDm();

  const handleSelect = useCallback(
    async (userId: string): Promise<void> => {
      if (!workspaceId || isPending) return;

      try {
        const dm = await openDm({ workspaceId, userId });
        closeModal();
        void navigate(`/app/${workspaceId}/${dm.id}`);
      } catch {
        // error handled by query client
      }
    },
    [workspaceId, openDm, closeModal, navigate, isPending]
  );

  const otherMembers = members?.filter((m) => m.id !== currentUser?.id) ?? [];

  return (
    <Modal open={activeModal === 'newDm'} onClose={closeModal} className="w-full max-w-sm rounded-lg bg-popover text-popover-foreground shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">New Direct Message</h3>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={closeModal}
        >
          &times;
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : otherMembers.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No other members in this workspace
          </p>
        ) : (
          otherMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              disabled={isPending}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-foreground hover:bg-accent disabled:opacity-50"
              onClick={() => void handleSelect(member.id)}
            >
              <PresenceDot userId={member.id} size="sm" />
              <span className="truncate font-medium">{member.displayName}</span>
              <span className="truncate text-xs text-muted-foreground">@{member.username}</span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
