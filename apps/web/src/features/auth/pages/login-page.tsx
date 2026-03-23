import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { Button, Input } from '@flowchat/ui';
import type { ApiError } from '@flowchat/types';
import { loginSchema, type LoginFormValues } from '../schemas';
import { useLogin } from '../api/use-login';

const DEMO_ACCOUNTS = [
  { name: 'Alice', email: 'alice@flowchat.dev' },
  { name: 'Bob', email: 'bob@flowchat.dev' },
  { name: 'Charlie', email: 'charlie@flowchat.dev' },
] as const;

const DEMO_PASSWORD = 'password123';

export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { mutate: login, isPending, error: mutationError } = useLogin();
  const [demoLoadingEmail, setDemoLoadingEmail] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(values: LoginFormValues): void {
    login(values, {
      onSuccess: () => {
        void navigate('/app', { replace: true });
      },
      onError: (err: AxiosError<ApiError>) => {
        const apiErr = err.response?.data?.error;
        if (apiErr?.field) {
          setError(apiErr.field as keyof LoginFormValues, {
            message: apiErr.message,
          });
        }
      },
    });
  }

  function loginAsDemo(email: string): void {
    setDemoLoadingEmail(email);
    login(
      { email, password: DEMO_PASSWORD },
      {
        onSuccess: () => {
          void navigate('/app', { replace: true });
        },
        onSettled: () => {
          setDemoLoadingEmail(null);
        },
      },
    );
  }

  const serverError =
    mutationError?.response?.data?.error?.field === undefined
      ? mutationError?.response?.data?.error?.message
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Sign in to FlowChat</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {serverError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
            ) : null}

            <Button type="submit" isLoading={isPending} className="mt-2 w-full">
              Sign in
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Try a demo account
          </p>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                className="w-full text-foreground"
                isLoading={demoLoadingEmail === account.email}
                disabled={isPending || demoLoadingEmail !== null}
                onClick={() => loginAsDemo(account.email)}
              >
                Login as {account.name}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
