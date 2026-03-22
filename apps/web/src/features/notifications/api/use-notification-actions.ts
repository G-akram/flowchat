import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';
import { NOTIFICATIONS_QUERY_KEY } from './use-notifications';

async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}

async function markAllRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}

async function clearAll(): Promise<void> {
  await apiClient.delete('/notifications/all');
}

export function useMarkNotificationRead(): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, string>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useDeleteNotification(): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, string>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllRead(): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, void>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, void>({
    mutationFn: markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useClearAllNotifications(): ReturnType<
  typeof useMutation<void, AxiosError<ApiError>, void>
> {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, void>({
    mutationFn: clearAll,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
