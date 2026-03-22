import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useCreateWorkspace } from '../api/use-create-workspace';

const createWorkspaceFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(64, 'Workspace name must be at most 64 characters'),
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceFormSchema>;

export function CreateWorkspaceModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const navigate = useNavigate();

  const { mutate, isPending } = useCreateWorkspace({
    onSuccess: (workspace) => {
      closeModal();
      navigate(`/app/${workspace.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceFormSchema),
    defaultValues: { name: '' },
  });

  function onSubmit(values: CreateWorkspaceFormValues): void {
    mutate(values, {
      onError: (err) => {
        const apiErr = err.response?.data?.error;
        if (apiErr?.field) {
          setError(apiErr.field as keyof CreateWorkspaceFormValues, { message: apiErr.message });
        }
      },
    });
  }

  function handleClose(): void {
    reset();
    closeModal();
  }

  return (
    <Modal open={activeModal === 'createWorkspace'} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Create a workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspaces are shared spaces for your team to communicate.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="ws-name" className="block text-sm font-medium text-foreground">
              Workspace name
            </label>
            <div className="mt-1">
              <Input
                id="ws-name"
                placeholder="e.g. Acme Corp"
                autoFocus
                {...register('name')}
                error={errors.name?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Create workspace
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
