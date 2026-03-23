import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaces } from '@/features/workspaces/api/use-workspaces';
import { ChannelView } from '@/features/messages/components/channel-view';
import { Sidebar } from '@/components/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import { ConnectionStatus } from '@/components/connection-status';
import { usePresence } from '@/hooks/use-presence';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { useWorkspaceSocket } from '@/hooks/use-workspace-socket';
import { usePageTitle } from '@/hooks/use-page-title';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { ProfileModal } from '@/features/users/components/profile-modal';
import { useChannels } from '@/features/channels/api/use-channels';
import { useDirectMessages } from '@/features/dm/api/use-direct-messages';
import { NewDmModal } from '@/features/dm/components/new-dm-modal';
import { SearchModal } from '@/features/search/components/search-modal';
import { CreateWorkspaceModal } from '@/features/workspaces/components/create-workspace-modal';
import { WorkspaceSettingsModal } from '@/features/workspaces/components/workspace-settings-modal';
import { InviteMemberModal } from '@/features/workspaces/components/invite-member-modal';
import { CreateChannelModal } from '@/features/channels/components/create-channel-modal';
import { EditChannelModal } from '@/features/channels/components/edit-channel-modal';
import { AddChannelMembersModal } from '@/features/channels/components/add-channel-members-modal';
import { WorkspaceMembersModal } from '@/features/workspaces/components/workspace-members-modal';
import { ChannelMembersModal } from '@/features/channels/components/channel-members-modal';
import { ChannelSettingsModal } from '@/features/channels/components/channel-settings-modal';
import { MediaViewer } from '@/features/uploads/components/media-viewer';
import { Button } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';

function ChannelPage(): React.JSX.Element {
  const { workspaceId, channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
  const { channels } = useChannels(workspaceId);
  const { dms } = useDirectMessages(workspaceId);

  const channel = channels?.find((c) => c.id === channelId);
  const dm = dms?.find((d) => d.id === channelId);
  const isDm = Boolean(dm);
  const displayName = dm
    ? dm.otherUser.displayName
    : channel?.name ?? undefined;

  const pageTitle = isDm ? displayName : displayName ? `#${displayName}` : undefined;
  usePageTitle(pageTitle);

  if (!channelId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Channel not found</p>
      </div>
    );
  }

  return <ChannelView channelId={channelId} channelName={displayName} isDm={isDm} />;
}

function WelcomePage(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome, {user?.displayName ?? 'User'}!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
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
  useWorkspaceSocket(workspaceId);
  useKeyboardNavigation();

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <ConnectionStatus />
      <div className="flex flex-1 overflow-hidden">
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>

        <main className="flex flex-1 flex-col overflow-hidden">
          <ErrorBoundary>
            <Routes>
              <Route path=":channelId" element={<ChannelPage />} />
              <Route path="*" element={<WelcomePage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      <ProfileModal />
      <NewDmModal />
      <SearchModal />
      <CreateWorkspaceModal />
      <WorkspaceSettingsModal />
      <InviteMemberModal />
      <CreateChannelModal />
      <EditChannelModal />
      <AddChannelMembersModal />
      <WorkspaceMembersModal />
      <ChannelMembersModal />
      <ChannelSettingsModal />
      <MediaViewer />
    </div>
  );
}

function WorkspaceRedirect(): React.JSX.Element {
  const { workspaces, isLoading } = useWorkspaces();
  const openModal = useUiStore((s) => s.openModal);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workspaces\u2026</p>
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
        <h2 className="text-lg font-semibold text-foreground">Welcome to FlowChat</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a workspace to get started
        </p>
        <Button
          className="mt-4"
          onClick={() => openModal('createWorkspace')}
        >
          Create a workspace
        </Button>
        <CreateWorkspaceModal />
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
