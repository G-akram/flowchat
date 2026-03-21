import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { ChannelView } from '@/features/messages/components/channel-view';
import { Sidebar } from '@/components/sidebar';
import { usePresence } from '@/hooks/use-presence';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { ProfileModal } from '@/features/users/components/profile-modal';

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

function WorkspaceLayout(): React.JSX.Element {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  usePresence(workspaceId);
  useHeartbeat();

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path=":channelId" element={<ChannelPage />} />
          <Route path="*" element={<WelcomePage />} />
        </Routes>
      </main>

      <ProfileModal />
    </div>
  );
}

function WorkspaceRedirect(): React.JSX.Element {
  const { workspaces, isLoading } = useWorkspaces();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-400">Loading workspaces…</p>
      </div>
    );
  }

  const firstWorkspace = workspaces?.[0];

  if (firstWorkspace) {
    return <Navigate to={`/app/${firstWorkspace.id}`} replace />;
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">No workspaces</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a workspace to get started
        </p>
      </div>
    </div>
  );
}

export function AppShell(): React.JSX.Element {
  return (
    <Routes>
      <Route path=":workspaceId/*" element={<WorkspaceLayout />} />
      <Route path="*" element={<WorkspaceRedirect />} />
    </Routes>
  );
}
