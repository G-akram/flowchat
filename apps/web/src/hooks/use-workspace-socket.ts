import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { SOCKET_EVENTS } from '@/features/messages/constants';
import {
  notifyChannelAdded,
  notifyChannelRemoved,
  notifyWorkspaceAdded,
  notifyWorkspaceRemoved,
} from '@/lib/notifications';
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/api/use-notifications';

interface WorkspaceMemberPayload {
  workspaceId: string;
  workspaceName?: string;
  userId: string;
  role?: string;
}

interface ChannelMemberPayload {
  workspaceId: string;
  channelId: string;
  channelName?: string;
  userId: string;
}

interface ChannelDeletedPayload {
  workspaceId: string;
  channelId: string;
}

interface ChannelUpdatedPayload {
  workspaceId: string;
  channel: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function useWorkspaceSocket(workspaceId: string | undefined): void {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = getSocket();

    if (!socket.connected) {
      connectSocket();
    }

    function handleWorkspaceMemberAdded(payload: WorkspaceMemberPayload): void {
      if (payload.workspaceId !== workspaceId) return;

      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });

      if (payload.userId === currentUserId) {
        void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });

        if (payload.workspaceName) {
          notifyWorkspaceAdded(payload.workspaceName);
        }
      }
    }

    function handleWorkspaceMemberRemoved(payload: WorkspaceMemberPayload): void {
      if (payload.workspaceId !== workspaceId) return;

      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });

      if (payload.userId === currentUserId) {
        void queryClient.invalidateQueries({ queryKey: ['workspaces'] });

        notifyWorkspaceRemoved(payload.workspaceName ?? 'this workspace');
      }
    }

    function handleChannelMemberAdded(payload: ChannelMemberPayload): void {
      if (payload.workspaceId !== workspaceId) return;

      void queryClient.invalidateQueries({ queryKey: ['channel-members', workspaceId, payload.channelId] });

      if (payload.userId === currentUserId) {
        void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });

        if (payload.channelName) {
          notifyChannelAdded(payload.channelName);
        }
      }
    }

    function handleChannelMemberRemoved(payload: ChannelMemberPayload): void {
      if (payload.workspaceId !== workspaceId) return;

      void queryClient.invalidateQueries({ queryKey: ['channel-members', workspaceId, payload.channelId] });

      if (payload.userId === currentUserId) {
        void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });

        if (payload.channelName) {
          notifyChannelRemoved(payload.channelName);
        }
      }
    }

    function handleChannelUpdated(payload: ChannelUpdatedPayload): void {
      if (payload.workspaceId !== workspaceId) return;

      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
    }

    function handleChannelDeleted(payload: ChannelDeletedPayload): void {
      if (payload.workspaceId !== workspaceId) return;

      void queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
    }

    function handleNotificationNew(): void {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotificationNew);
    socket.on(SOCKET_EVENTS.WORKSPACE_MEMBER_ADDED, handleWorkspaceMemberAdded);
    socket.on(SOCKET_EVENTS.WORKSPACE_MEMBER_REMOVED, handleWorkspaceMemberRemoved);
    socket.on(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, handleChannelMemberAdded);
    socket.on(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, handleChannelMemberRemoved);
    socket.on(SOCKET_EVENTS.CHANNEL_UPDATED, handleChannelUpdated);
    socket.on(SOCKET_EVENTS.CHANNEL_DELETED, handleChannelDeleted);

    return (): void => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotificationNew);
      socket.off(SOCKET_EVENTS.WORKSPACE_MEMBER_ADDED, handleWorkspaceMemberAdded);
      socket.off(SOCKET_EVENTS.WORKSPACE_MEMBER_REMOVED, handleWorkspaceMemberRemoved);
      socket.off(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, handleChannelMemberAdded);
      socket.off(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, handleChannelMemberRemoved);
      socket.off(SOCKET_EVENTS.CHANNEL_UPDATED, handleChannelUpdated);
      socket.off(SOCKET_EVENTS.CHANNEL_DELETED, handleChannelDeleted);
    };
  }, [workspaceId, currentUserId, queryClient]);
}
