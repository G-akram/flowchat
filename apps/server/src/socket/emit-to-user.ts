import { getIO } from './socket.server';

export function emitToUser(userId: string, event: string, payload: unknown): void {
  const io = getIO();

  for (const [, socket] of io.sockets.sockets) {
    if (socket.data['userId'] === userId) {
      socket.emit(event, payload);
    }
  }
}
