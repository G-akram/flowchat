import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../api/use-me';

export function PublicRoute(): React.JSX.Element {
  const { user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
