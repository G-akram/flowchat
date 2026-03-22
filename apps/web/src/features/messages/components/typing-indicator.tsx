import React from 'react';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

function formatTypingText(users: TypingUser[]): string {
  const first = users[0];
  const second = users[1];

  if (users.length === 1 && first) {
    return `${first.displayName} is typing...`;
  }

  if (users.length === 2 && first && second) {
    return `${first.displayName} and ${second.displayName} are typing...`;
  }

  return 'Several people are typing...';
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps): React.JSX.Element | null {
  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-1">
      <span className="text-xs text-muted-foreground">
        {formatTypingText(typingUsers)}
      </span>
    </div>
  );
}
