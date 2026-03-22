import type { Request, Response, NextFunction } from 'express';
import type { CreateChannelInput, UpdateChannelInput, AddChannelMemberInput, ChannelParams, WorkspaceParams } from './channel.schemas';
import { create, listByWorkspace, join, getById, update, remove, leave, addMember } from './channel.service';
import { AppError } from '../../lib/errors';

export async function createChannelHandler(
  req: Request<WorkspaceParams, unknown, CreateChannelInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const channel = await create(req.params.workspaceId, req.body, user.id);

    res.status(201).json({ data: { channel } });
  } catch (err) {
    next(err);
  }
}

export async function listChannelsHandler(
  req: Request<WorkspaceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const channels = await listByWorkspace(req.params.workspaceId, user.id);

    res.status(200).json({ data: { channels } });
  } catch (err) {
    next(err);
  }
}

export async function joinChannelHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const channel = await join(req.params.workspaceId, req.params.channelId, user.id);

    res.status(200).json({ data: { channel } });
  } catch (err) {
    next(err);
  }
}

export async function getChannelHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const channel = await getById(req.params.workspaceId, req.params.channelId, user.id);

    res.status(200).json({ data: { channel } });
  } catch (err) {
    next(err);
  }
}

export async function updateChannelHandler(
  req: Request<ChannelParams, unknown, UpdateChannelInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const channel = await update(req.params.workspaceId, req.params.channelId, req.body, user.id);

    res.status(200).json({ data: { channel } });
  } catch (err) {
    next(err);
  }
}

export async function deleteChannelHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await remove(req.params.workspaceId, req.params.channelId, user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function leaveChannelHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await leave(req.params.workspaceId, req.params.channelId, user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addChannelMemberHandler(
  req: Request<ChannelParams, unknown, AddChannelMemberInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await addMember(req.params.workspaceId, req.params.channelId, req.body, user.id);

    res.status(201).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}
