import { searchMessages, type SearchResultRow } from './search.repository';
import { AppError } from '../../lib/errors';
import { findWorkspaceMember } from '../workspaces/workspace.repository';

interface SearchMessageResponse {
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
  channel: {
    id: string;
    name: string;
    isDirectMessage: boolean;
  };
}

function mapSearchResult(row: SearchResultRow): SearchMessageResponse {
  return {
    id: row.id,
    channelId: row.channelId,
    content: row.content,
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    user: {
      id: row.userId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
    },
    channel: {
      id: row.channelId,
      name: row.channelName,
      isDirectMessage: row.isDirectMessage,
    },
  };
}

export async function search(
  workspaceId: string,
  userId: string,
  query: string,
  limit: number
): Promise<{ messages: SearchMessageResponse[] }> {
  const member = await findWorkspaceMember(workspaceId, userId);

  if (!member) {
    throw new AppError('NOT_A_MEMBER', 'You are not a member of this workspace', 403);
  }

  const rows = await searchMessages(workspaceId, userId, query, limit);

  return { messages: rows.map(mapSearchResult) };
}
