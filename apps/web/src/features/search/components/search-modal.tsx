import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/ui-store';
import { useSearchMessages } from '../api/use-search-messages';
import type { SearchResultMessage } from '../types';

const DEBOUNCE_MS = 300;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function highlightMatch(content: string, query: string): string {
  if (!query.trim()) return content;
  const truncated = content.length > 200 ? content.slice(0, 200) + '…' : content;
  return truncated;
}

function SearchResult({
  result,
  query,
  onClick,
}: {
  result: SearchResultMessage;
  query: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="w-full rounded px-3 py-2 text-left hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {result.channel.isDirectMessage
            ? `DM with ${result.user.displayName}`
            : `#${result.channel.name}`}
        </span>
        {!result.channel.isDirectMessage && (
          <>
            <span>·</span>
            <span>{result.user.displayName}</span>
          </>
        )}
        <span>·</span>
        <span>{formatTimestamp(result.createdAt)}</span>
      </div>
      <p className="mt-0.5 truncate text-sm text-foreground">
        {highlightMatch(result.content, query)}
      </p>
    </button>
  );
}

export function SearchModal(): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const openModal = useUiStore((s) => s.openModal);
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading, isError } = useSearchMessages(workspaceId, debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, DEBOUNCE_MS);

    return (): void => {
      clearTimeout(timer);
    };
  }, [inputValue]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const current = useUiStore.getState().activeModal;
        if (current === 'search') {
          closeModal();
        } else {
          openModal('search');
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openModal, closeModal]);

  useEffect(() => {
    if (activeModal === 'search') {
      setInputValue('');
      setDebouncedQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [activeModal]);

  const handleResultClick = useCallback(
    (result: SearchResultMessage): void => {
      closeModal();
      navigate(`/app/${workspaceId}/${result.channelId}?highlight=${result.id}`);
    },
    [closeModal, navigate, workspaceId]
  );

  if (activeModal !== 'search') return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-popover shadow-xl"
        onClick={(event): void => event.stopPropagation()}
      >
        <div className="flex items-center border-b border-border px-4">
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Search messages…"
            value={inputValue}
            onChange={(event): void => setInputValue(event.target.value)}
            onKeyDown={(event): void => {
              if (event.key === 'Escape') {
                closeModal();
              }
            }}
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {debouncedQuery.trim().length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Type to search messages
            </p>
          ) : isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-4 text-center text-sm text-destructive">
              Search failed. Please try again.
            </p>
          ) : results && results.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No messages found
            </p>
          ) : (
            results?.map((result) => (
              <SearchResult
                key={result.id}
                result={result}
                query={debouncedQuery}
                onClick={(): void => handleResultClick(result)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
