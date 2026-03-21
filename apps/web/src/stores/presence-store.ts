import { create } from 'zustand';

type PresenceStatus = 'online' | 'away' | 'offline';

interface PresenceState {
  presenceMap: Map<string, PresenceStatus>;
  setPresence: (userId: string, status: PresenceStatus) => void;
  setBulkPresence: (entries: Array<{ userId: string; status: PresenceStatus }>) => void;
  getStatus: (userId: string) => PresenceStatus;
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  presenceMap: new Map(),

  setPresence: (userId: string, status: PresenceStatus): void => {
    set((state) => {
      const next = new Map(state.presenceMap);
      next.set(userId, status);
      return { presenceMap: next };
    });
  },

  setBulkPresence: (entries: Array<{ userId: string; status: PresenceStatus }>): void => {
    set((state) => {
      const next = new Map(state.presenceMap);
      for (const entry of entries) {
        next.set(entry.userId, entry.status);
      }
      return { presenceMap: next };
    });
  },

  getStatus: (userId: string): PresenceStatus => {
    return get().presenceMap.get(userId) ?? 'offline';
  },
}));
