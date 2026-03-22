import React, { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export function ConnectionStatus(): React.JSX.Element | null {
  const [state, setState] = useState<ConnectionState>('connected');

  useEffect(() => {
    const socket = getSocket();

    function handleConnect(): void {
      setState('connected');
    }

    function handleDisconnect(): void {
      setState('disconnected');
    }

    function handleReconnectAttempt(): void {
      setState('reconnecting');
    }

    if (socket.connected) {
      setState('connected');
    } else {
      setState('disconnected');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);

    return (): void => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, []);

  if (state === 'connected') return null;

  const label = state === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';
  const bgClass = state === 'reconnecting'
    ? 'bg-yellow-500/90'
    : 'bg-destructive/90';

  return (
    <div className={`flex h-7 items-center justify-center text-xs font-medium text-white ${bgClass}`}>
      {state === 'reconnecting' && (
        <svg className="mr-1.5 h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {label}
    </div>
  );
}
