import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useCreateChannel } from '../api/use-create-channel';

const createChannelFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80, 'Channel name must be at most 80 characters')
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

type CreateChannelFormValues = z.infer<typeof createChannelFormSchema>;

export function CreateChannelModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const { mutate, isPending } = useCreateChannel({
    onSuccess: (channel) => {
      closeModal();
      if (workspaceId) {
        navigate(`/app/${workspaceId}/${channel.id}`);
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelFormSchema),
    defaultValues: { name: '', description: '', isPrivate: false },
  });

  function onSubmit(values: CreateChannelFormValues): void {
    if (!workspaceId) return;

    mutate(
      { workspaceId, ...values },
      {
        onError: (err) => {
          const apiErr = err.response?.data?.error;
          if (apiErr?.field) {
            setError(apiErr.field as keyof CreateChannelFormValues, { message: apiErr.message });
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
    <Modal open={activeModal === 'createChannel'} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create a channel</h2>
        <p className="mt-1 text-sm text-gray-500">
          Channels are where your team communicates about topics.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="ch-name" className="block text-sm font-medium text-gray-700">
              Channel name
            </label>
            <div className="mt-1">
              <Input
                id="ch-name"
                placeholder="e.g. design-feedback"
                autoFocus
                {...register('name')}
                error={errors.name?.message}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ch-desc" className="block text-sm font-medium text-gray-700">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <div className="mt-1">
              <Input
                id="ch-desc"
                placeholder="What is this channel about?"
                {...register('description')}
                error={errors.description?.message}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ch-private"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              {...register('isPrivate')}
            />
            <label htmlFor="ch-private" className="text-sm text-gray-700">
              Make private
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Create channel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
