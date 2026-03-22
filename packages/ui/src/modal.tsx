import * as React from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string | undefined;
}

export function Modal({ open, onClose, children, className }: ModalProps): React.JSX.Element | null {
  const backdropRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === backdropRef.current) {
      onClose();
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className={className ?? 'w-full max-w-md rounded-lg bg-popover text-popover-foreground shadow-xl'}>
        {children}
      </div>
    </div>
  );
}
