import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaces } from '../api/use-workspaces';
import { useUpdateWorkspace } from '../api/use-update-workspace';
import { useDeleteWorkspace } from '../api/use-delete-workspace';
import { useLeaveWorkspace } from '../api/use-leave-workspace';

const renameSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(64, 'Workspace name must be at most 64 characters'),
});

type RenameFormValues = z.infer<typeof renameSchema>;

export function WorkspaceSettingsModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { workspaces } = useWorkspaces();
  const workspace = workspaces?.find((w) => w.id === workspaceId);
  const isOwner = workspace?.ownerId === user?.id;

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace({
    onSuccess: () => {
      closeModal();
    },
  });

  const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace({
    onSuccess: () => {
      closeModal();
      void navigate('/app');
    },
  });

  const { mutate: leaveWorkspace, isPending: isLeaving } = useLeaveWorkspace({
    onSuccess: () => {
      closeModal();
      void navigate('/app');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: workspace?.name ?? '' },
  });

  useEffect(() => {
    if (activeModal === 'workspaceSettings' && workspace) {
      reset({ name: workspace.name });
      setDeleteConfirm('');
      setErrorMessage(null);
    }
  }, [activeModal, workspace, reset]);

  function onRename(values: RenameFormValues): void {
    if (!workspaceId) return;
    updateWorkspace({ workspaceId, name: values.name });
  }

  function handleDelete(): void {
    if (!workspaceId) return;
    setErrorMessage(null);
    deleteWorkspace(workspaceId, {
      onError: (err) => {
        setErrorMessage(err.response?.data?.error?.message ?? 'Failed to delete workspace');
      },
    });
  }

  function handleLeave(): void {
    if (!workspaceId) return;
    setErrorMessage(null);
    leaveWorkspace(workspaceId, {
      onError: (err) => {
        setErrorMessage(err.response?.data?.error?.message ?? 'Failed to leave workspace');
      },
    });
  }

  const isOpen = activeModal === 'workspaceSettings' && Boolean(workspace) && Boolean(workspaceId);

  return (
    <Modal open={isOpen} onClose={closeModal} className="w-full max-w-lg rounded-lg bg-popover text-popover-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Workspace settings</h2>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={closeModal}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {isOwner && (
            <section>
              <h3 className="text-sm font-medium text-foreground">Rename workspace</h3>
              <form onSubmit={handleSubmit(onRename)} className="mt-2 flex gap-2">
                <div className="flex-1">
                  <Input
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
                <Button type="submit" isLoading={isUpdating} size="sm">
                  Rename
                </Button>
              </form>
            </section>
          )}

          <section>
            <h3 className="text-sm font-medium text-foreground">Invite members</h3>
            <p className="mt-1 text-xs text-muted-foreground">Add teammates to this workspace.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                closeModal();
                useUiStore.getState().openModal('inviteMembers');
              }}
            >
              Invite by email
            </Button>
          </section>

          {!isOwner && (
            <section className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground">Leave workspace</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                You will lose access to all channels and messages in this workspace.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                isLoading={isLeaving}
                onClick={handleLeave}
              >
                Leave workspace
              </Button>
            </section>
          )}

          {isOwner && workspace && (
            <section className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-destructive">Danger zone</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                This will permanently delete the workspace, all channels, and all messages. This action cannot be undone.
              </p>
              <div className="mt-2 space-y-2">
                <Input
                  placeholder={`Type "${workspace.name}" to confirm`}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  isLoading={isDeleting}
                  disabled={deleteConfirm !== workspace.name}
                  onClick={handleDelete}
                >
                  Delete workspace
                </Button>
              </div>
            </section>
          )}
        </div>
    </Modal>
  );
}
