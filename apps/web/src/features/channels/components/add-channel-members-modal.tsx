import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useWorkspaceMembers } from '@/features/workspaces/api/use-workspace-members';
import { useAddChannelMember } from '../api/use-add-channel-member';
import { PresenceDot } from '@/components/presence-dot';
import { useAuthStore } from '@/stores/auth-store';

export function AddChannelMembersModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalData = useUiStore((s) => s.modalData);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const { members } = useWorkspaceMembers(workspaceId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: addMember, isPending } = useAddChannelMember({
    onSuccess: () => {
      setSuccessMessage('Member added to channel!');
      setErrorMessage(null);
    },
  });

  if (activeModal !== 'addChannelMembers' || !modalData?.channelId) {
    return null;
  }

  function handleAdd(userId: string): void {
    if (!workspaceId || !modalData?.channelId) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    addMember(
      { workspaceId, channelId: modalData.channelId, userId },
      {
        onError: (err) => {
          setErrorMessage(err.response?.data?.error?.message ?? 'Failed to add member');
        },
      }
    );
  }

  function handleClose(): void {
    setSuccessMessage(null);
    setErrorMessage(null);
    closeModal();
  }

  const filteredMembers = members?.filter((m) => m.id !== currentUser?.id) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add members</h2>
            <p className="text-sm text-gray-500">
              Add workspace members to #{modalData.channelName}
            </p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={handleClose}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {successMessage && (
            <div className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {filteredMembers.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No other workspace members</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {filteredMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <PresenceDot userId={member.id} size="sm" />
                    <span className="text-sm text-gray-700">{member.displayName}</span>
                    <span className="text-xs text-gray-400">@{member.username}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isPending}
                    onClick={() => handleAdd(member.id)}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-3">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
