import { AppError } from '../../lib/errors';
import {
  addReaction as addReactionInDb,
  removeReaction as removeReactionInDb,
  getReactionsForMessage,
  findMessageChannelId,
} from './reaction.repository';
import { findChannelMember } from '../messages/message.repository';

export interface ReactionResponse {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export async function addReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<{ channelId: string; reactions: ReactionResponse[] }> {
  const channelId = await findMessageChannelId(messageId);

  if (!channelId) {
    throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', 404);
  }

  const member = await findChannelMember(channelId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this channel', 403);
  }

  await addReactionInDb(messageId, userId, emoji);

  const aggregates = await getReactionsForMessage(messageId);

  return {
    channelId,
    reactions: aggregates.map((agg) => ({
      emoji: agg.emoji,
      count: agg.count,
      hasReacted: agg.userIds.includes(userId),
    })),
  };
}

export async function removeReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<{ channelId: string; reactions: ReactionResponse[] }> {
  const channelId = await findMessageChannelId(messageId);

  if (!channelId) {
    throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', 404);
  }

  const member = await findChannelMember(channelId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this channel', 403);
  }

  await removeReactionInDb(messageId, userId, emoji);

  const aggregates = await getReactionsForMessage(messageId);

  return {
    channelId,
    reactions: aggregates.map((agg) => ({
      emoji: agg.emoji,
      count: agg.count,
      hasReacted: agg.userIds.includes(userId),
    })),
  };
}
