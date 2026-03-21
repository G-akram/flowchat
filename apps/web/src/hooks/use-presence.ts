import { useEffect } from 'react';
import { getSocket, connectSocket } from '@/lib/socket';
import { usePresenceStore } from '@/stores/presence-store';
import { apiClient } from '@/lib/api-client';

const SOCKET_PRESENCE_UPDATE = 'presence:update';

interface PresenceUpdatePayload {
  userId: string;
  status: 'online' | 'away' | 'offline';
}

interface PresenceEntry {
  userId: string;
  status: 'online' | 'away' | 'offline';
}

interface PresenceResponse {
  data: {
    presence: PresenceEntry[];
  };
}

export function usePresence(workspaceId: string | undefined): void {
  const setPresence = usePresenceStore((s) => s.setPresence);
  const setBulkPresence = usePresenceStore((s) => s.setBulkPresence);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetchInitialPresence(): Promise<void> {
      try {
        const response = await apiClient.get<PresenceResponse>(
          `/workspaces/${workspaceId}/presence`
        );
        setBulkPresence(response.data.data.presence);
      } catch {
        // Silently fail — presence is non-critical
      }
    }

    void fetchInitialPresence();
  }, [workspaceId, setBulkPresence]);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = getSocket();

    function joinWorkspace(): void {
      socket.emit('workspace:join', workspaceId);
    }

    if (socket.connected) {
      joinWorkspace();
    } else {
      connectSocket();
      socket.once('connect', joinWorkspace);
    }

    function handlePresenceUpdate(payload: PresenceUpdatePayload): void {
      setPresence(payload.userId, payload.status);
    }

    socket.on(SOCKET_PRESENCE_UPDATE, handlePresenceUpdate);

    return () => {
      socket.off('connect', joinWorkspace);
      socket.emit('workspace:leave', workspaceId);
      socket.off(SOCKET_PRESENCE_UPDATE, handlePresenceUpdate);
    };
  }, [workspaceId, setPresence]);
}
