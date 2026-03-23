import type { Request, Response, NextFunction } from 'express';
import type { CreateChannelInput, UpdateChannelInput, AddChannelMemberInput, ChannelParams, ChannelMemberParams, WorkspaceParams } from './channel.schemas';
import { create, listByWorkspace, join, getById, update, remove, leave, addMember, listMembers, kickMember, markRead, getUnreadCounts } from './channel.service';
import { findChannelById } from './channel.repository';
import { create as createNotification } from '../notifications/notification.service';
import { AppError } from '../../lib/errors';
import { getIO } from '../../socket/socket.server';
import { emitToUser } from '../../socket/emit-to-user';
import { SOCKET_EVENTS } from '../../socket/events';

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

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.CHANNEL_UPDATED, {
      workspaceId: req.params.workspaceId,
      channel,
    });

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

    const channel = await findChannelById(req.params.channelId);

    await remove(req.params.workspaceId, req.params.channelId, user.id);

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.CHANNEL_DELETED, {
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      channelName: channel?.name,
    });

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

    const channel = await findChannelById(req.params.channelId);

    await leave(req.params.workspaceId, req.params.channelId, user.id);

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, {
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      channelName: channel?.name,
      userId: user.id,
    });

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

    const channel = await findChannelById(req.params.channelId);
    const channelName = channel?.name ?? 'unknown';

    await addMember(req.params.workspaceId, req.params.channelId, req.body, user.id);

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, {
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      channelName,
      userId: req.body.userId,
    });

    if (req.body.userId !== user.id) {
      const notification = await createNotification({
        userId: req.body.userId,
        workspaceId: req.params.workspaceId,
        type: 'channel_invited',
        title: `Added to #${channelName}`,
        body: `${user.displayName} added you to #${channelName}`,
        actionUrl: `/app/${req.params.workspaceId}/${req.params.channelId}`,
      });

      emitToUser(req.body.userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    }

    res.status(201).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

export async function listChannelMembersHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const members = await listMembers(req.params.workspaceId, req.params.channelId, user.id);

    res.status(200).json({ data: { members } });
  } catch (err) {
    next(err);
  }
}

export async function markChannelReadHandler(
  req: Request<ChannelParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await markRead(req.params.channelId, user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCountsHandler(
  req: Request<WorkspaceParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const unreadCounts = await getUnreadCounts(req.params.workspaceId, user.id);

    res.status(200).json({ data: { unreadCounts } });
  } catch (err) {
    next(err);
  }
}

export async function kickChannelMemberHandler(
  req: Request<ChannelMemberParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const channel = await findChannelById(req.params.channelId);
    const channelName = channel?.name ?? 'unknown';

    await kickMember(req.params.workspaceId, req.params.channelId, req.params.userId, user.id);

    getIO().to(`workspace:${req.params.workspaceId}`).emit(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, {
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      channelName,
      userId: req.params.userId,
    });

    const notification = await createNotification({
      userId: req.params.userId,
      workspaceId: req.params.workspaceId,
      type: 'channel_removed',
      title: `Removed from #${channelName}`,
      body: `You were removed from #${channelName}`,
    });

    emitToUser(req.params.userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
