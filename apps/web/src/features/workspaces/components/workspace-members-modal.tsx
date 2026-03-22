import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceMembers } from '../api/use-workspace-members';
import { useWorkspaces } from '../api/use-workspaces';
import { useKickWorkspaceMember } from '../api/use-kick-workspace-member';
import { PresenceDot } from '@/components/presence-dot';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-gray-100 text-gray-500',
};

export function WorkspaceMembersModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const { members, isLoading } = useWorkspaceMembers(workspaceId);
  const { workspaces } = useWorkspaces();
  const workspace = workspaces?.find((w) => w.id === workspaceId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentMember = members?.find((m) => m.id === currentUser?.id);
  const canKick = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const { mutate: kickMember, isPending: isKicking } = useKickWorkspaceMember();

  if (activeModal !== 'workspaceMembers') {
    return null;
  }

  function handleKick(userId: string, displayName: string): void {
    if (!workspaceId) return;
    if (!window.confirm(`Remove ${displayName} from this workspace?`)) return;

    setErrorMessage(null);
    kickMember(
      { workspaceId, userId },
      {
        onError: (err) => {
          setErrorMessage(err.response?.data?.error?.message ?? 'Failed to remove member');
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            <p className="text-sm text-gray-500">
              {workspace?.name} &middot; {members?.length ?? 0} members
            </p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={closeModal}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {errorMessage && (
            <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {members?.map((member) => {
                const isCurrentUser = member.id === currentUser?.id;
                const isOwner = member.role === 'owner';
                const showKick = canKick && !isCurrentUser && !isOwner;

                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <PresenceDot userId={member.id} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {member.displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] ?? ROLE_COLORS['member']}`}>
                            {ROLE_LABELS[member.role] ?? member.role}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">@{member.username}</span>
                      </div>
                    </div>
                    {showKick && (
                      <Button
                        size="sm"
                        variant="ghost"
                        isLoading={isKicking}
                        onClick={() => handleKick(member.id, member.displayName)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-3">
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeModal}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
