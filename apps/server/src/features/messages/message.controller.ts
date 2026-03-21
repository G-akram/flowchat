import type { Request, Response, NextFunction } from 'express';
import type {
  ChannelParams,
  MessageParams,
  CreateMessageInput,
  UpdateMessageInput,
  ListMessagesQuery,
} from './message.schemas';
import { create, list, update, remove } from './message.service';
import { AppError } from '../../lib/errors';
import { getIO } from '../../socket/socket.server';
import { SOCKET_EVENTS } from '../../socket/events';

export async function listMessagesHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const query = req.query as unknown as ListMessagesQuery;

    const { messages, nextCursor } = await list(
      req.params.channelId,
      user.id,
      query.limit,
      query.cursor
    );

    res.status(200).json({ data: messages, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function createMessageHandler(
  req: Request<ChannelParams, unknown, CreateMessageInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const message = await create(req.params.channelId, req.body, user.id);

    getIO().to(`channel:${req.params.channelId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

    res.status(201).json({ data: { message } });
  } catch (err) {
    next(err);
  }
}

export async function updateMessageHandler(
  req: Request<MessageParams, unknown, UpdateMessageInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const message = await update(
      req.params.channelId,
      req.params.messageId,
      req.body,
      user.id
    );

    getIO().to(`channel:${req.params.channelId}`).emit(SOCKET_EVENTS.MESSAGE_UPDATED, message);

    res.status(200).json({ data: { message } });
  } catch (err) {
    next(err);
  }
}

export async function deleteMessageHandler(
  req: Request<MessageParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await remove(req.params.channelId, req.params.messageId, user.id);

    getIO()
      .to(`channel:${req.params.channelId}`)
      .emit(SOCKET_EVENTS.MESSAGE_DELETED, {
        id: req.params.messageId,
        channelId: req.params.channelId,
      });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
