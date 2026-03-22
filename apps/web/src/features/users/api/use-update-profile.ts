import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { User, ApiError } from '@flowchat/types';

interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
}

interface UpdateProfileResponse {
  data: {
    user: User;
  };
}

async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const response = await apiClient.patch<UpdateProfileResponse>('/users/me', input);
  return response.data.data.user;
}

interface UseUpdateProfileOptions {
  onSuccess?: () => void;
}

interface UseUpdateProfileResult {
  mutate: (input: UpdateProfileInput) => void;
  isPending: boolean;
  isError: boolean;
  error: AxiosError<ApiError> | null;
}

export function useUpdateProfile(options?: UseUpdateProfileOptions): UseUpdateProfileResult {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const { mutate, isPending, isError, error } = useMutation<
    User,
    AxiosError<ApiError>,
    UpdateProfileInput
  >({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      setUser(user);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
      options?.onSuccess?.();
    },
  });

  return { mutate, isPending, isError, error };
}
