import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@flowchat/ui';

interface InlineEditFormProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function InlineEditForm({
  initialContent,
  onSave,
  onCancel,
}: InlineEditFormProps): React.JSX.Element {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, []);

  const trimmed = content.trim();
  const canSave = trimmed.length > 0 && trimmed !== initialContent;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSave) onSave(trimmed);
      else if (trimmed === initialContent) onCancel();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  return (
    <div className="mt-0.5">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={Math.min(content.split('\n').length + 1, 6)}
        className="w-full resize-none rounded border border-ring bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          <kbd className="rounded border border-border px-1 font-sans">Enter</kbd> save
          {' · '}
          <kbd className="rounded border border-border px-1 font-sans">Esc</kbd> cancel
        </span>
        <div className="ml-auto flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-6 px-2 py-0 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-6 px-2 py-0 text-xs"
            disabled={!canSave}
            onClick={() => { if (canSave) onSave(trimmed); }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
