import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Modal } from '@flowchat/ui';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useChannelMembers } from '../api/use-channel-members';
import { useChannels } from '../api/use-channels';
import { useKickChannelMember } from '../api/use-kick-channel-member';
import { useOpenDm } from '@/features/dm/api/use-open-dm';
import { PresenceDot } from '@/components/presence-dot';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-600',
};

const ROLE_ORDER: Record<string, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

export function ChannelMembersModal(): React.JSX.Element {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalData = useUiStore((s) => s.modalData);
  const closeModal = useUiStore((s) => s.closeModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const channelId = modalData?.channelId;

  const { members, isLoading } = useChannelMembers(workspaceId, channelId);
  const { channels } = useChannels(workspaceId);
  const channel = channels?.find((c) => c.id === channelId);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentMember = members?.find((m) => m.id === currentUser?.id);
  const currentRole = currentMember?.role;
  const canKick = currentRole === 'owner' || currentRole === 'admin' || channel?.createdById === currentUser?.id;
  const isGeneral = channel?.name === 'general';

  const { mutate: kickMember, isPending: isKicking } = useKickChannelMember();
  const { mutateAsync: openDm } = useOpenDm();

  const filtered = useMemo(() => {
    if (!members) return [];
    const query = search.toLowerCase().trim();
    const list = query
      ? members.filter(
          (m) =>
            m.displayName.toLowerCase().includes(query) ||
            m.username.toLowerCase().includes(query)
        )
      : members;
    return [...list].sort(
      (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
    );
  }, [members, search]);

  function handleKick(e: React.MouseEvent, userId: string, displayName: string): void {
    e.stopPropagation();
    if (!workspaceId || !channelId) return;
    if (!window.confirm(`Remove ${displayName} from #${channel?.name}?`)) return;

    setErrorMessage(null);
    kickMember(
      { workspaceId, channelId, userId },
      {
        onError: (err) => {
          setErrorMessage(err.response?.data?.error?.message ?? 'Failed to remove member');
        },
      }
    );
  }

  async function handleMemberClick(userId: string): Promise<void> {
    if (!workspaceId || userId === currentUser?.id) return;
    try {
      const dm = await openDm({ workspaceId, userId });
      handleClose();
      navigate(`/app/${workspaceId}/dm/${dm.id}`);
    } catch {
      // silently ignore DM open errors
    }
  }

  function handleClose(): void {
    setSearch('');
    setErrorMessage(null);
    closeModal();
  }

  return (
    <Modal open={activeModal === 'channelMembers' && Boolean(channelId)} onClose={handleClose}>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Channel members</h2>
          <p className="text-sm text-gray-500">
            #{channel?.name} &middot; {members?.length ?? 0} members
          </p>
        </div>
        <button
          type="button"
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onClick={handleClose}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 pt-3">
        <Input
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="p-4">
        {errorMessage && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {search ? 'No members match your search' : 'No members'}
          </p>
        ) : (
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {filtered.map((member) => {
              const isCurrentUser = member.id === currentUser?.id;
              const showKick = canKick && !isCurrentUser && !isGeneral;

              return (
                <li
                  key={member.id}
                  className={`flex items-center justify-between rounded-md px-3 py-2 ${isCurrentUser ? 'hover:bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => handleMemberClick(member.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PresenceDot userId={member.id} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {member.displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="shrink-0 text-xs text-gray-400">(you)</span>
                        )}
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] ?? ROLE_COLORS['member']}`}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">@{member.username}</span>
                    </div>
                  </div>
                  {showKick && (
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={isKicking}
                      onClick={(e) => handleKick(e, member.id, member.displayName)}
                      className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200 px-6 py-3">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
