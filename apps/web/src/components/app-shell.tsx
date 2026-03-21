import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/api/use-logout';
import { ChannelView } from '@/features/messages/components/channel-view';
import { Button } from '@flowchat/ui';

function ChannelPage(): React.JSX.Element {
  const { channelId } = useParams<{ channelId: string }>();

  if (!channelId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">Channel not found</p>
      </div>
    );
  }

  return <ChannelView channelId={channelId} />;
}

function WelcomePage(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome, {user?.displayName ?? 'User'}!
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a channel to start chatting
        </p>
      </div>
    </div>
  );
}

export function AppShell(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className="flex h-screen bg-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-sm font-semibold text-gray-900">FlowChat</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Channels
          </p>
        </div>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm text-gray-700">
              {user?.displayName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              isLoading={isPending}
              onClick={() => logout()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="channels/:channelId" element={<ChannelPage />} />
          <Route path="*" element={<WelcomePage />} />
        </Routes>
      </main>
    </div>
  );
}
