import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal } from '@flowchat/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile } from '../api/use-update-profile';
import { useUiStore } from '@/stores/ui-store';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(64),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const user = useAuthStore((s) => s.user);
  const { mutate, isPending } = useUpdateProfile({ onSuccess: closeModal });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  useEffect(() => {
    if (activeModal === 'editProfile' && user) {
      reset({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? '',
      });
    }
  }, [activeModal, user, reset]);

  function onSubmit(values: ProfileFormValues): void {
    mutate({
      displayName: values.displayName,
      avatarUrl: values.avatarUrl || null,
    });
  }

  return (
    <Modal open={activeModal === 'editProfile'} onClose={closeModal}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
              Display Name
            </label>
            <div className="mt-1">
              <Input
                id="displayName"
                {...register('displayName')}
                error={errors.displayName?.message}
              />
            </div>
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-foreground">
              Avatar URL
            </label>
            <div className="mt-1">
              <Input
                id="avatarUrl"
                placeholder="https://example.com/avatar.jpg"
                {...register('avatarUrl')}
                error={errors.avatarUrl?.message}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste an image URL for now. File upload coming soon.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
