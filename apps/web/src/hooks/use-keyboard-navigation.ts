import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channels/api/use-channels';
import { useDirectMessages } from '@/features/dm/api/use-direct-messages';
import { useUiStore } from '@/stores/ui-store';

export function useKeyboardNavigation(): void {
  const { workspaceId, channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
  const navigate = useNavigate();
  const closeModal = useUiStore((s) => s.closeModal);
  const activeModal = useUiStore((s) => s.activeModal);
  const { channels } = useChannels(workspaceId);
  const { dms } = useDirectMessages(workspaceId);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && activeModal) {
        e.preventDefault();
        closeModal();
        return;
      }

      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      if (!workspaceId || activeModal) return;

      e.preventDefault();

      const allIds: string[] = [];
      if (channels) {
        allIds.push(...channels.map((c) => c.id));
      }
      if (dms) {
        allIds.push(...dms.map((d) => d.id));
      }

      if (allIds.length === 0) return;

      const currentIndex = channelId ? allIds.indexOf(channelId) : -1;
      let nextIndex: number;

      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < allIds.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : allIds.length - 1;
      }

      const nextId = allIds[nextIndex];
      if (nextId) {
        void navigate(`/app/${workspaceId}/${nextId}`);
      }
    },
    [workspaceId, channelId, channels, dms, activeModal, closeModal, navigate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return (): void => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
