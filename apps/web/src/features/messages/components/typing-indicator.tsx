import React from 'react';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

function formatTypingText(users: TypingUser[]): string {
  if (users.length === 1) {
    return `${users[0]!.displayName} is typing...`;
  }

  if (users.length === 2) {
    return `${users[0]!.displayName} and ${users[1]!.displayName} are typing...`;
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
