import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useEffect } from 'react';
import { apiClient, setAccessToken } from '@/lib/api-client';
import type { User } from '@flowchat/types';
import { useAuthStore } from '@/stores/auth-store';

interface MeResponse {
  data: {
    user: User;
  };
}

async function fetchMe(): Promise<User> {
  const response = await apiClient.get<MeResponse>('/auth/me');
  return response.data.data.user;
}

interface UseMeResult {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useMe(): UseMeResult {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const { data, isLoading, isError } = useQuery<User, AxiosError>({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (isError) {
      setAccessToken(null);
      clearUser();
    }
  }, [isError, clearUser]);

  return { user: data, isLoading, isError };
}
