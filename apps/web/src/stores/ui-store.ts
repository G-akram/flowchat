import { create } from 'zustand';

type ModalType =
  | 'createChannel'
  | 'createWorkspace'
  | 'inviteMembers'
  | 'editProfile'
  | 'newDm'
  | 'search'
  | 'workspaceSettings'
  | 'editChannel'
  | 'addChannelMembers'
  | 'workspaceMembers'
  | 'channelMembers'
  | 'channelSettings'
  | null;

interface ModalData {
  channelId?: string;
  channelName?: string;
  channelDescription?: string | null;
}

interface UiState {
  isSidebarOpen: boolean;
  activeModal: ModalType;
  modalData: ModalData | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: NonNullable<ModalType>, data?: ModalData) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  modalData: null,

  toggleSidebar: (): void => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open: boolean): void => {
    set({ isSidebarOpen: open });
  },

  openModal: (modal: NonNullable<ModalType>, data?: ModalData): void => {
    set({ activeModal: modal, modalData: data ?? null });
  },

  closeModal: (): void => {
    set({ activeModal: null, modalData: null });
  },
}));
