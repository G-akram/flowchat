import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { Button, Input } from '@flowchat/ui';
import type { ApiError } from '@flowchat/types';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { useRegister } from '../api/use-register';

export function RegisterPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending, error: mutationError } = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(values: RegisterFormValues): void {
    registerUser(values, {
      onSuccess: () => {
        navigate('/app', { replace: true });
      },
      onError: (err: AxiosError<ApiError>) => {
        const apiErr = err.response?.data?.error;
        if (apiErr?.field) {
          setError(apiErr.field as keyof RegisterFormValues, {
            message: apiErr.message,
          });
        }
      },
    });
  }

  const serverError =
    mutationError?.response?.data?.error?.field === undefined
      ? mutationError?.response?.data?.error?.message
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">Join FlowChat today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
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
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="johndoe"
                error={errors.username?.message}
                {...register('username')}
              />
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Display name
              </label>
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                error={errors.displayName?.message}
                {...register('displayName')}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {serverError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
            ) : null}

            <Button type="submit" isLoading={isPending} className="mt-2 w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
