import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/ui-store';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';

export function WorkspaceMenu({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const openModal = useUiStore((s) => s.openModal);
  const { workspaces } = useWorkspaces();

  const otherWorkspaces = workspaces?.filter((w) => w.id !== workspaceId) ?? [];

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-popover py-1 shadow-lg">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
        onClick={() => {
          onClose();
          openModal('workspaceSettings');
        }}
      >
        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
        onClick={() => {
          onClose();
          openModal('workspaceMembers');
        }}
      >
        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Members
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
        onClick={() => {
          onClose();
          openModal('inviteMembers');
        }}
      >
        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Invite people
      </button>

      {otherWorkspaces.length > 0 && (
        <>
          <div className="my-1 border-t border-border" />
          <p className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Switch workspace
          </p>
          {otherWorkspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
              onClick={() => {
                onClose();
                void navigate(`/app/${ws.id}`);
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
                {ws.name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
        </>
      )}

      <div className="my-1 border-t border-border" />
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
        onClick={() => {
          onClose();
          openModal('createWorkspace');
        }}
      >
        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create workspace
      </button>
    </div>
  );
}
