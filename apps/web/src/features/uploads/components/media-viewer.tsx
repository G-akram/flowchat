import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useMediaViewerStore } from '@/stores/media-viewer-store';
import { MediaViewerImage } from './media-viewer-image';
import { MediaViewerPdf } from './media-viewer-pdf';

function DownloadIcon(): React.JSX.Element {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CloseIcon(): React.JSX.Element {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronLeft(): React.JSX.Element {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight(): React.JSX.Element {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function truncateFileName(name: string, max = 52): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0 && name.length - ext <= 8) {
    const extPart = name.slice(ext);
    return `${name.slice(0, max - extPart.length - 1)}…${extPart}`;
  }
  return `${name.slice(0, max - 1)}…`;
}

export function MediaViewer(): React.JSX.Element | null {
  const { isOpen, items, activeIndex, close, navigate } = useMediaViewerStore();
  const item = items[activeIndex];
  const total = items.length;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < total - 1;

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') navigate(-1);
    else if (e.key === 'ArrowRight') navigate(1);
  }, [close, navigate]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return (): void => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isImage = item.mimeType.startsWith('image/');
  const isPdf = item.mimeType === 'application/pdf';

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.fileName}
      className="fixed inset-0 z-[300] flex flex-col bg-black/95"
    >
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/70" title={item.fileName}>
          {truncateFileName(item.fileName)}
        </p>

        {total > 1 && (
          <span className="shrink-0 text-xs tabular-nums text-white/40">
            {activeIndex + 1} / {total}
          </span>
        )}

        <a
          href={item.url}
          download={item.fileName}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded px-2.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          title="Download file"
        >
          <DownloadIcon />
          Download
        </a>

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          onClick={close}
          title="Close (Esc)"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Backdrop — clicking dark area closes the viewer */}
        <button
          type="button"
          className="absolute inset-0 z-0 h-full w-full cursor-default"
          onClick={close}
          tabIndex={-1}
          aria-label="Close viewer"
        />

        {/* Navigation: previous */}
        {hasPrev && (
          <button
            type="button"
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
            onClick={() => navigate(-1)}
            title="Previous (←)"
          >
            <ChevronLeft />
          </button>
        )}

        {/* Navigation: next */}
        {hasNext && (
          <button
            type="button"
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
            onClick={() => navigate(1)}
            title="Next (→)"
          >
            <ChevronRight />
          </button>
        )}

        {/* Media content — stopPropagation prevents backdrop close on content clicks */}
        <div
          className="relative z-10 flex h-full w-full flex-col px-16 py-4"
          onClick={(e) => e.stopPropagation()}
        >
          {isImage && (
            <MediaViewerImage key={item.url} url={item.url} fileName={item.fileName} />
          )}
          {isPdf && (
            <MediaViewerPdf key={item.url} url={item.url} fileName={item.fileName} />
          )}
          {!isImage && !isPdf && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/40">Preview not available for this file type.</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      {isImage && (
        <div className="flex h-8 shrink-0 items-center justify-center gap-4 border-t border-white/5">
          <span className="text-[11px] text-white/25">
            Scroll to zoom · Drag to pan · Double-click to reset
            {total > 1 && ' · ← → to navigate'}
          </span>
        </div>
      )}
    </div>,
    document.body
  );
}
