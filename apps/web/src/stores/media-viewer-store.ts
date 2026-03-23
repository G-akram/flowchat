import { create } from 'zustand';

export interface MediaItem {
  url: string;
  fileName: string;
  mimeType: string;
}

interface MediaViewerState {
  isOpen: boolean;
  items: MediaItem[];
  activeIndex: number;
  open: (items: MediaItem[], index: number) => void;
  close: () => void;
  navigate: (direction: 1 | -1) => void;
}

export const useMediaViewerStore = create<MediaViewerState>()((set, get) => ({
  isOpen: false,
  items: [],
  activeIndex: 0,

  open: (items, index): void => {
    set({ isOpen: true, items, activeIndex: index });
  },

  close: (): void => {
    set({ isOpen: false, items: [], activeIndex: 0 });
  },

  navigate: (direction): void => {
    const { items, activeIndex } = get();
    const next = activeIndex + direction;
    if (next >= 0 && next < items.length) {
      set({ activeIndex: next });
    }
  },
}));
