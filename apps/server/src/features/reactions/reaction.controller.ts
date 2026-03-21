import type { Request, Response, NextFunction } from 'express';
import type {
  ReactionParams,
  RemoveReactionParams,
  AddReactionInput,
} from './reaction.schemas';
import { addReaction, removeReaction } from './reaction.service';
import { AppError } from '../../lib/errors';
import { getIO } from '../../socket/socket.server';
import { SOCKET_EVENTS } from '../../socket/events';

export async function addReactionHandler(
  req: Request<ReactionParams, unknown, AddReactionInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { channelId, reactions } = await addReaction(
      req.params.messageId,
      req.body.emoji,
      user.id
    );

    getIO()
      .to(`channel:${channelId}`)
      .emit(SOCKET_EVENTS.MESSAGE_UPDATED, {
        id: req.params.messageId,
        channelId,
        reactions,
      });

    res.status(200).json({ data: { reactions } });
  } catch (err) {
    next(err);
  }
}

export async function removeReactionHandler(
  req: Request<RemoveReactionParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { channelId, reactions } = await removeReaction(
      req.params.messageId,
      req.params.emoji,
      user.id
    );

    getIO()
      .to(`channel:${channelId}`)
      .emit(SOCKET_EVENTS.MESSAGE_UPDATED, {
        id: req.params.messageId,
        channelId,
        reactions,
      });

    res.status(200).json({ data: { reactions } });
  } catch (err) {
    next(err);
  }
}
