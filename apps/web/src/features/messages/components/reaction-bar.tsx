import React from 'react';
import type { ReactionData } from '../types';

interface ReactionBarProps {
  reactions: ReactionData[];
  onToggle: (emoji: string, hasReacted: boolean) => void;
}

export function ReactionBar({
  reactions,
  onToggle,
}: ReactionBarProps): React.JSX.Element | null {
  if (reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            reaction.hasReacted
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
          }`}
          onClick={() => onToggle(reaction.emoji, reaction.hasReacted)}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
