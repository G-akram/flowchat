import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceMembers } from '@/features/workspaces/api/use-workspace-members';
import { useChannelMembers } from '../api/use-channel-members';
import { useAddChannelMember } from '../api/use-add-channel-member';
import { useOpenDm } from '@/features/dm/api/use-open-dm';
import { PresenceDot } from '@/components/presence-dot';

export function AddChannelMembersModal(): React.JSX.Element {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalData = useUiStore((s) => s.modalData);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const channelId = modalData?.channelId;

  const { members: allWorkspaceMembers } = useWorkspaceMembers(workspaceId);
  const { members: channelMembersList } = useChannelMembers(workspaceId, channelId);
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: addMember, isPending } = useAddChannelMember({
    onSuccess: () => {
      setSuccessMessage('Member added to channel!');
      setErrorMessage(null);
    },
  });

  const { mutateAsync: openDm } = useOpenDm();

  const nonMembers = useMemo(() => {
    if (!allWorkspaceMembers) return [];
    const channelMemberIds = new Set(channelMembersList?.map((m) => m.id) ?? []);
    const available = allWorkspaceMembers.filter((m) => !channelMemberIds.has(m.id));
    const query = search.toLowerCase().trim();
    if (!query) return available;
    return available.filter(
      (m) =>
        m.displayName.toLowerCase().includes(query) ||
        m.username.toLowerCase().includes(query)
    );
  }, [allWorkspaceMembers, channelMembersList, search]);

  function handleAdd(e: React.MouseEvent, userId: string): void {
    e.stopPropagation();
    if (!workspaceId || !channelId) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    addMember(
      { workspaceId, channelId, userId },
      {
        onError: (err) => {
          setErrorMessage(err.response?.data?.error?.message ?? 'Failed to add member');
        },
      }
    );
  }

  async function handleMemberClick(userId: string): Promise<void> {
    if (!workspaceId || userId === currentUser?.id) return;
    try {
      const dm = await openDm({ workspaceId, userId });
      handleClose();
      navigate(`/app/${workspaceId}/dm/${dm.id}`);
    } catch {
      // silently ignore DM open errors
    }
  }

  function handleClose(): void {
    setSearch('');
    setSuccessMessage(null);
    setErrorMessage(null);
    closeModal();
  }

  return (
    <Modal open={activeModal === 'addChannelMembers' && Boolean(channelId)} onClose={handleClose}>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Add members</h2>
          <p className="text-sm text-gray-500">
            Add workspace members to #{modalData?.channelName}
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

      <div className="px-4 pt-3">
        <Input
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
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

        {nonMembers.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {search ? 'No members match your search' : 'All workspace members are already in this channel'}
          </p>
        ) : (
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {nonMembers.map((member) => {
              const isCurrentUser = member.id === currentUser?.id;

              return (
                <li
                  key={member.id}
                  className={`flex items-center justify-between rounded-md px-3 py-2 ${isCurrentUser ? 'hover:bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => handleMemberClick(member.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PresenceDot userId={member.id} size="sm" />
                    <div className="min-w-0">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {member.displayName}
                      </span>
                      <div>
                        <span className="text-xs text-gray-400">@{member.username}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isPending}
                    onClick={(e) => handleAdd(e, member.id)}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </li>
              );
            })}
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
    </Modal>
  );
}
