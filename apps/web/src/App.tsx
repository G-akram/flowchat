import React, { useState } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';
import { useAuthStore } from '@/stores/auth-store';

export function App(): React.JSX.Element {
  const [view, setView] = useState<'login' | 'register'>('login');
  const user = useAuthStore((s) => s.user);

  if (user !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.displayName}!</h1>
          <p className="mt-2 text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        {view === 'login' ? <LoginForm /> : <RegisterForm />}
        <p className="text-center text-sm text-gray-600">
          {view === 'login' ? (
            <>
              No account?{' '}
              <button
                className="font-medium text-indigo-600 hover:underline"
                onClick={() => setView('register')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className="font-medium text-indigo-600 hover:underline"
                onClick={() => setView('login')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
