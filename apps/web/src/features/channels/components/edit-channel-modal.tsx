import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useUpdateChannel } from '../api/use-update-channel';

const editChannelFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
});

type EditChannelFormValues = z.infer<typeof editChannelFormSchema>;

export function EditChannelModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalData = useUiStore((s) => s.modalData);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const { mutate, isPending } = useUpdateChannel({
    onSuccess: () => {
      closeModal();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<EditChannelFormValues>({
    resolver: zodResolver(editChannelFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (activeModal === 'editChannel' && modalData) {
      reset({
        name: modalData.channelName ?? '',
        description: modalData.channelDescription ?? '',
      });
    }
  }, [activeModal, modalData, reset]);

  function onSubmit(values: EditChannelFormValues): void {
    if (!workspaceId || !modalData?.channelId) return;

    mutate(
      {
        workspaceId,
        channelId: modalData.channelId,
        name: values.name,
        description: values.description || null,
      },
      {
        onError: (err) => {
          const apiErr = err.response?.data?.error;
          if (apiErr?.field) {
            setError(apiErr.field as keyof EditChannelFormValues, { message: apiErr.message });
          }
        },
      }
    );
  }

  function handleClose(): void {
    reset();
    closeModal();
  }

  return (
    <Modal open={activeModal === 'editChannel' && Boolean(modalData?.channelId)} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Edit channel</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-ch-name" className="block text-sm font-medium text-foreground">
              Channel name
            </label>
            <div className="mt-1">
              <Input
                id="edit-ch-name"
                autoFocus
                {...register('name')}
                error={errors.name?.message}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-ch-desc" className="block text-sm font-medium text-foreground">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="mt-1">
              <Input
                id="edit-ch-desc"
                placeholder="What is this channel about?"
                {...register('description')}
                error={errors.description?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
