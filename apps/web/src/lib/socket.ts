import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api-client';

const SOCKET_URL = (import.meta.env['VITE_SOCKET_URL'] as string | undefined) ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (callback) => {
        callback({ token: getAccessToken() });
      },
    });
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
