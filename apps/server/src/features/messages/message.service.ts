import { AppError } from '../../lib/errors';
import type { CreateMessageInput, UpdateMessageInput } from './message.schemas';
import {
  createMessage as createMessageInDb,
  findMessageById,
  findMessagesWithUser,
  updateMessageContent,
  deleteMessage as deleteMessageInDb,
  findChannelMember,
  type MessageWithUser,
} from './message.repository';
import {
  getReactionsForMessage,
  getReactionsForMessages,
} from '../reactions/reaction.repository';

interface ReactionResponse {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageResponse {
  id: string;
  channelId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  reactions: ReactionResponse[];
}

function mapMessage(
  msg: MessageWithUser,
  reactions: ReactionResponse[] = []
): MessageResponse {
  return {
    id: msg.id,
    channelId: msg.channelId,
    content: msg.content,
    editedAt: msg.editedAt ? msg.editedAt.toISOString() : null,
    createdAt: msg.createdAt.toISOString(),
    user: msg.user,
    reactions,
  };
}

async function ensureChannelMember(channelId: string, userId: string): Promise<void> {
  const member = await findChannelMember(channelId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this channel', 403);
  }
}

export async function create(
  channelId: string,
  input: CreateMessageInput,
  userId: string
): Promise<MessageResponse> {
  await ensureChannelMember(channelId, userId);

  const message = await createMessageInDb({
    channelId,
    userId,
    content: input.content,
  });

  return mapMessage(message, []);
}

export async function list(
  channelId: string,
  userId: string,
  limit: number,
  cursor?: string
): Promise<{ messages: MessageResponse[]; nextCursor: string | null }> {
  await ensureChannelMember(channelId, userId);

  const rows = await findMessagesWithUser(channelId, limit, cursor);

  const hasMore = rows.length > limit;
  const trimmed = rows.slice(0, limit);

  const messageIds = trimmed.map((m) => m.id);
  const reactionsMap = await getReactionsForMessages(messageIds);

  const messages = trimmed.map((msg) => {
    const aggregates = reactionsMap.get(msg.id) ?? [];
    const reactionResponses = aggregates.map((agg) => ({
      emoji: agg.emoji,
      count: agg.count,
      hasReacted: agg.userIds.includes(userId),
    }));
    return mapMessage(msg, reactionResponses);
  });

  const nextCursor = hasMore ? messages[messages.length - 1]!.id : null;

  return { messages, nextCursor };
}

export async function update(
  channelId: string,
  messageId: string,
  input: UpdateMessageInput,
  userId: string
): Promise<MessageResponse> {
  await ensureChannelMember(channelId, userId);

  const existing = await findMessageById(messageId);

  if (!existing || existing.channelId !== channelId) {
    throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', 404);
  }

  if (existing.userId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only edit your own messages', 403);
  }

  const updated = await updateMessageContent(messageId, input.content);

  if (!updated) {
    throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', 404);
  }

  const aggregates = await getReactionsForMessage(messageId);
  const reactionResponses = aggregates.map((agg) => ({
    emoji: agg.emoji,
    count: agg.count,
    hasReacted: agg.userIds.includes(userId),
  }));

  return mapMessage(updated, reactionResponses);
}

export async function remove(
  channelId: string,
  messageId: string,
  userId: string
): Promise<void> {
  await ensureChannelMember(channelId, userId);

  const existing = await findMessageById(messageId);

  if (!existing || existing.channelId !== channelId) {
    throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', 404);
  }

  if (existing.userId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only delete your own messages', 403);
  }

  await deleteMessageInDb(messageId);
}
