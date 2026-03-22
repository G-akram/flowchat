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
import {
  createAttachments,
  findAttachmentsByMessageId,
  findAttachmentsByMessageIds,
} from '../uploads/upload.repository';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';

interface ReactionResponse {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface AttachmentResponse {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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
  attachments: AttachmentResponse[];
}

function mapMessage(
  msg: MessageWithUser,
  reactions: ReactionResponse[] = [],
  attachments: AttachmentResponse[] = []
): MessageResponse {
  return {
    id: msg.id,
    channelId: msg.channelId,
    content: msg.content,
    editedAt: msg.editedAt ? msg.editedAt.toISOString() : null,
    createdAt: msg.createdAt.toISOString(),
    user: msg.user,
    reactions,
    attachments,
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

  let attachmentResponses: AttachmentResponse[] = [];

  if (input.attachments && input.attachments.length > 0) {
    const records = input.attachments.map((attachment) => {
      const { data: publicData } = supabase.storage
        .from(env.SUPABASE_BUCKET_NAME)
        .getPublicUrl(attachment.key);

      return {
        messageId: message.id,
        url: publicData.publicUrl,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
      };
    });

    const dbAttachments = await createAttachments(records);
    attachmentResponses = dbAttachments.map((a) => ({
      id: a.id,
      url: a.url,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    }));
  }

  return mapMessage(message, [], attachmentResponses);
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
  const attachmentsMap = await findAttachmentsByMessageIds(messageIds);

  const messages = trimmed.map((msg) => {
    const aggregates = reactionsMap.get(msg.id) ?? [];
    const reactionResponses = aggregates.map((agg) => ({
      emoji: agg.emoji,
      count: agg.count,
      hasReacted: agg.userIds.includes(userId),
    }));
    const msgAttachments = (attachmentsMap.get(msg.id) ?? []).map((a) => ({
      id: a.id,
      url: a.url,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    }));
    return mapMessage(msg, reactionResponses, msgAttachments);
  });

  const lastMessage = hasMore ? messages[messages.length - 1] : undefined;
  const nextCursor = lastMessage ? lastMessage.id : null;

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

  const dbAttachments = await findAttachmentsByMessageId(messageId);
  const attachmentResponses = dbAttachments.map((a) => ({
    id: a.id,
    url: a.url,
    fileName: a.fileName,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
  }));

  return mapMessage(updated, reactionResponses, attachmentResponses);
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
