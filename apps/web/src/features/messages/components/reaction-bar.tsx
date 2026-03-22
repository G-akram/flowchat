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
              ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
              : 'border-border bg-muted text-muted-foreground hover:border-border hover:bg-accent'
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
