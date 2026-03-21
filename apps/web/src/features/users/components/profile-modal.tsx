import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@flowchat/ui';
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

  if (activeModal !== 'editProfile') {
    return null;
  }

  function onSubmit(values: ProfileFormValues): void {
    mutate({
      displayName: values.displayName,
      avatarUrl: values.avatarUrl || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
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
            <p className="mt-1 text-xs text-gray-400">
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
    </div>
  );
}
