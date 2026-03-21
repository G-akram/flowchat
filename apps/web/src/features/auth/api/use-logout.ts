import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient, setAccessToken } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/lib/query-client';

async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export function useLogout(): ReturnType<typeof useMutation<void, AxiosError, void>> {
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation<void, AxiosError, void>({
    mutationFn: logoutRequest,
    onSettled: () => {
      setAccessToken(null);
      clearUser();
      queryClient.clear();
    },
  });
}
