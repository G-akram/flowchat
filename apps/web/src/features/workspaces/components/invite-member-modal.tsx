import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useInviteMember } from '../api/use-invite-member';

const inviteFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function InviteMemberModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutate, isPending } = useInviteMember({
    onSuccess: () => {
      setSuccessMessage('Member invited successfully!');
      resetForm();
    },
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
    setError,
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: InviteFormValues): void {
    if (!workspaceId) return;
    setSuccessMessage(null);

    mutate(
      { workspaceId, email: values.email },
      {
        onError: (err) => {
          const apiErr = err.response?.data?.error;
          if (apiErr?.field) {
            setError(apiErr.field as keyof InviteFormValues, { message: apiErr.message });
          } else if (apiErr?.message) {
            setError('email', { message: apiErr.message });
          }
        },
      }
    );
  }

  function handleClose(): void {
    resetForm();
    setSuccessMessage(null);
    closeModal();
  }

  return (
    <Modal open={activeModal === 'inviteMembers'} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Invite a member</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email address of the person you want to invite.
        </p>

        {successMessage && (
          <div className="mt-3 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="mt-1">
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                autoFocus
                {...register('email')}
                error={errors.email?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button type="submit" isLoading={isPending}>
              Send invite
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
