import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { usePresenceStore } from '@/stores/presence-store';
import { useAuthStore } from '@/stores/auth-store';

const HEARTBEAT_INTERVAL_MS = 60_000;
const PRESENCE_HEARTBEAT = 'presence:heartbeat';

export function useHeartbeat(): void {
  const setPresence = usePresenceStore((s) => s.setPresence);
  const userId = useAuthStore((s) => s.user?.id);

  const getStatus = useCallback((): 'online' | 'away' => {
    return document.visibilityState === 'visible' ? 'online' : 'away';
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function sendHeartbeat(): void {
      if (socket.connected) {
        const status = getStatus();
        socket.emit(PRESENCE_HEARTBEAT, { status });

        if (userId) {
          setPresence(userId, status);
        }
      }
    }

    function handleVisibilityChange(): void {
      sendHeartbeat();
    }

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getStatus, userId, setPresence]);
}
