import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/api/use-logout';
import { Button } from '@flowchat/ui';

export function AppShell(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.displayName ?? 'User'}!
        </h1>
        <p className="mt-2 text-sm text-gray-500">{user?.email}</p>
        <Button
          variant="outline"
          className="mt-4"
          isLoading={isPending}
          onClick={() => logout()}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
