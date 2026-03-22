import { create } from 'zustand';

type ModalType = 'createChannel' | 'createWorkspace' | 'inviteMembers' | 'editProfile' | 'newDm' | 'search' | null;

interface UiState {
  isSidebarOpen: boolean;
  activeModal: ModalType;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: NonNullable<ModalType>) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: true,
  activeModal: null,

  toggleSidebar: (): void => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open: boolean): void => {
    set({ isSidebarOpen: open });
  },

  openModal: (modal: NonNullable<ModalType>): void => {
    set({ activeModal: modal });
  },

  closeModal: (): void => {
    set({ activeModal: null });
  },
}));
