import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient, setAccessToken } from '@/lib/api-client';
import type { ApiError, User } from '@flowchat/types';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginFormValues } from '../schemas';

interface LoginResponse {
  data: {
    user: User;
    accessToken: string;
  };
}

async function loginRequest(input: LoginFormValues): Promise<LoginResponse['data']> {
  const response = await apiClient.post<LoginResponse>('/auth/login', input);
  return response.data.data;
}

export function useLogin(): ReturnType<
  typeof useMutation<LoginResponse['data'], AxiosError<ApiError>, LoginFormValues>
> {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<LoginResponse['data'], AxiosError<ApiError>, LoginFormValues>({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
  });
}
