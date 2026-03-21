import { create } from 'zustand';
import type { User } from '@flowchat/types';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user: User): void => set({ user }),
  clearUser: (): void => set({ user: null }),
}));
