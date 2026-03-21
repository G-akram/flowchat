import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient, setAccessToken } from '@/lib/api-client';
import type { ApiError, User } from '@flowchat/types';
import { useAuthStore } from '@/stores/auth-store';
import type { RegisterFormValues } from '../schemas';

interface RegisterResponse {
  data: {
    user: User;
    accessToken: string;
  };
}

async function registerRequest(input: RegisterFormValues): Promise<RegisterResponse['data']> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', input);
  return response.data.data;
}

export function useRegister(): ReturnType<
  typeof useMutation<RegisterResponse['data'], AxiosError<ApiError>, RegisterFormValues>
> {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<RegisterResponse['data'], AxiosError<ApiError>, RegisterFormValues>({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
  });
}
