import React from 'react';

interface MessageActionBarProps {
  canEdit: boolean;
  alignLeft: boolean;
  onReactionClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function MessageActionBar({
  canEdit,
  alignLeft,
  onReactionClick,
  onEditClick,
  onDeleteClick,
}: MessageActionBarProps): React.JSX.Element {
  const positionClass = alignLeft ? 'left-0' : 'right-0';

  return (
    <div
      className={`invisible absolute -top-3 z-10 flex items-center divide-x divide-border rounded border border-border bg-popover shadow-sm group-hover/msg:visible ${positionClass}`}
    >
      <button
        type="button"
        className="inline-flex h-6 items-center gap-1 px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={onReactionClick}
        title="Add reaction"
      >
        <span className="text-sm leading-none">😀</span>
        <span className="leading-none">+</span>
      </button>

      {canEdit && (
        <button
          type="button"
          className="inline-flex h-6 items-center px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onEditClick}
          title="Edit message"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {canEdit && (
        <button
          type="button"
          className="inline-flex h-6 items-center px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          onClick={onDeleteClick}
          title="Delete message"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
