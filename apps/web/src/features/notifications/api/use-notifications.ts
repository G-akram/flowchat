import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@flowchat/types';
import type { Notification } from '../types';

interface NotificationsResponse {
  data: {
    notifications: Notification[];
    unreadCount: number;
  };
}

async function fetchNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const response = await apiClient.get<NotificationsResponse>('/notifications');
  return response.data.data;
}

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

export function useNotifications(): UseNotificationsResult {
  const { data, isLoading } = useQuery<
    { notifications: Notification[]; unreadCount: number },
    AxiosError<ApiError>
  >({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
  };
}
