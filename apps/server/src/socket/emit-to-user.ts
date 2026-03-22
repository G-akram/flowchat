import { getIO } from './socket.server';

interface SocketData {
  userId: string;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  const io = getIO();

  for (const [, socket] of io.sockets.sockets) {
    const data = socket.data as SocketData;
    if (data.userId === userId) {
      socket.emit(event, payload);
    }
  }
}
