import React, { useRef, useEffect } from 'react';

const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉',
  '🔥', '👀', '🙌', '💯', '✅', '❌', '🚀', '💡',
  '🤔', '👏', '😍', '🙏', '💪', '😎', '🤝', '⭐',
  '🎯', '💀', '😅', '🫡', '👋', '🤣',
] as const;

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute right-2 top-0 z-20 w-56 -translate-y-full rounded-lg border border-gray-200 bg-white p-2 shadow-xl"
    >
      <div className="grid grid-cols-8 gap-0.5">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded text-base transition-colors hover:bg-gray-100"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
