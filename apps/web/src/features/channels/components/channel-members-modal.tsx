import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelMembers } from '../api/use-channel-members';
import { useChannels } from '../api/use-channels';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { useKickChannelMember } from '../api/use-kick-channel-member';
import { PresenceDot } from '@/components/presence-dot';

export function ChannelMembersModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalData = useUiStore((s) => s.modalData);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const channelId = modalData?.channelId;

  const { members, isLoading } = useChannelMembers(workspaceId, channelId);
  const { channels } = useChannels(workspaceId);
  const { workspaces } = useWorkspaces();
  const channel = channels?.find((c) => c.id === channelId);
  const workspace = workspaces?.find((w) => w.id === workspaceId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOwnerOrAdmin = workspace?.ownerId === currentUser?.id;
  const isChannelCreator = channel?.createdById === currentUser?.id;
  const canKick = isOwnerOrAdmin || isChannelCreator;
  const isGeneral = channel?.name === 'general';

  const { mutate: kickMember, isPending: isKicking } = useKickChannelMember();

  if (activeModal !== 'channelMembers' || !channelId) {
    return null;
  }

  function handleKick(userId: string, displayName: string): void {
    if (!workspaceId || !channelId) return;
    if (!window.confirm(`Remove ${displayName} from #${channel?.name}?`)) return;

    setErrorMessage(null);
    kickMember(
      { workspaceId, channelId, userId },
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
            <h2 className="text-lg font-semibold text-gray-900">Channel members</h2>
            <p className="text-sm text-gray-500">
              #{channel?.name} &middot; {members?.length ?? 0} members
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
                const showKick = canKick && !isCurrentUser && !isGeneral;

                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <PresenceDot userId={member.id} size="sm" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900">
                          {member.displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-gray-400">(you)</span>
                        )}
                        <div>
                          <span className="text-xs text-gray-400">@{member.username}</span>
                        </div>
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
