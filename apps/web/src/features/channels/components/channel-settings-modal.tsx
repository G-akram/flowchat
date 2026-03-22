import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { useChannels } from '../api/use-channels';
import { useDeleteChannel } from '../api/use-delete-channel';
import { useLeaveChannel } from '../api/use-leave-channel';

export function ChannelSettingsModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalData = useUiStore((s) => s.modalData);
  const closeModal = useUiStore((s) => s.closeModal);
  const openModal = useUiStore((s) => s.openModal);
  const { workspaceId, channelId: activeChannelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { workspaces } = useWorkspaces();
  const { channels } = useChannels(workspaceId);
  const workspace = workspaces?.find((w) => w.id === workspaceId);

  const channelId = modalData?.channelId;
  const channel = channels?.find((c) => c.id === channelId);

  const isOwnerOrAdmin =
    workspace?.ownerId === user?.id;
  const isChannelCreator = channel?.createdById === user?.id;
  const canManage = isOwnerOrAdmin || isChannelCreator;
  const isGeneral = channel?.name === 'general';

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: deleteChannel, isPending: isDeleting } = useDeleteChannel({
    onSuccess: () => {
      closeModal();
      if (activeChannelId === channelId) {
        navigate(`/app/${workspaceId}`);
      }
    },
  });

  const { mutate: leaveChannel, isPending: isLeaving } = useLeaveChannel({
    onSuccess: () => {
      closeModal();
      if (activeChannelId === channelId) {
        navigate(`/app/${workspaceId}`);
      }
    },
  });

  function handleClose(): void {
    setDeleteConfirm('');
    setErrorMessage(null);
    closeModal();
  }

  function handleDelete(): void {
    if (!workspaceId || !channelId) return;
    setErrorMessage(null);
    deleteChannel(
      { workspaceId, channelId },
      {
        onError: (err) => {
          setErrorMessage(err.response?.data?.error?.message ?? 'Failed to delete channel');
        },
      }
    );
  }

  function handleLeave(): void {
    if (!workspaceId || !channelId) return;
    setErrorMessage(null);
    leaveChannel(
      { workspaceId, channelId },
      {
        onError: (err) => {
          setErrorMessage(err.response?.data?.error?.message ?? 'Failed to leave channel');
        },
      }
    );
  }

  const isOpen = activeModal === 'channelSettings' && Boolean(channelId) && Boolean(channel);

  if (!isOpen || !channel || !channelId) {
    return <Modal open={false} onClose={handleClose}><span /></Modal>;
  }

  return (
    <Modal open={isOpen} onClose={handleClose} className="w-full max-w-lg rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          #{channel.name} settings
        </h2>
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

      <div className="space-y-6 p-6">
        {errorMessage && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {channel.description && (
          <section>
            <h3 className="text-sm font-medium text-gray-900">Description</h3>
            <p className="mt-1 text-sm text-gray-600">{channel.description}</p>
          </section>
        )}

        <section>
          <h3 className="text-sm font-medium text-gray-900">Quick actions</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  closeModal();
                  openModal('editChannel', {
                    channelId: channel.id,
                    channelName: channel.name,
                    channelDescription: channel.description,
                  });
                }}
              >
                Edit channel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                closeModal();
                openModal('channelMembers', { channelId: channel.id });
              }}
            >
              View members
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                closeModal();
                openModal('addChannelMembers', { channelId: channel.id });
              }}
            >
              Add members
            </Button>
          </div>
        </section>

        {!isGeneral && (
          <section className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900">Leave channel</h3>
            <p className="mt-1 text-xs text-gray-500">
              You will no longer receive messages from this channel.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-2"
              isLoading={isLeaving}
              onClick={handleLeave}
            >
              Leave channel
            </Button>
          </section>
        )}

        {canManage && !isGeneral && channel && (
          <section className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-red-600">Danger zone</h3>
            <p className="mt-1 text-xs text-gray-500">
              This will permanently delete the channel and all its messages. This cannot be undone.
            </p>
            <div className="mt-2 space-y-2">
              <Input
                placeholder={`Type "${channel.name}" to confirm`}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                disabled={deleteConfirm !== channel.name}
                onClick={handleDelete}
              >
                Delete channel
              </Button>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
