import React from 'react';
import { usePresenceStore } from '@/stores/presence-store';

type DotSize = 'sm' | 'md';

interface PresenceDotProps {
  userId: string;
  size?: DotSize;
}

const SIZE_CLASSES: Record<DotSize, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
};

const STATUS_CLASSES: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-muted-foreground/40',
};

export function PresenceDot({ userId, size = 'sm' }: PresenceDotProps): React.JSX.Element {
  const status = usePresenceStore((s) => s.presenceMap.get(userId) ?? 'offline');

  return (
    <span
      className={`inline-block shrink-0 rounded-full ${SIZE_CLASSES[size]} ${STATUS_CLASSES[status] ?? STATUS_CLASSES['offline']}`}
      title={status}
    />
  );
}
