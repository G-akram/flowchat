import { create } from 'zustand';

interface UnreadState {
  counts: Record<string, number>;
  setUnreadCounts: (counts: Record<string, number>) => void;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
  counts: {},

  setUnreadCounts: (counts): void => {
    set({ counts });
  },

  incrementUnread: (channelId): void => {
    set((state) => ({
      counts: {
        ...state.counts,
        [channelId]: (state.counts[channelId] ?? 0) + 1,
      },
    }));
  },

  clearUnread: (channelId): void => {
    set((state) => {
      const next = { ...state.counts };
      delete next[channelId];
      return { counts: next };
    });
  },
}));
