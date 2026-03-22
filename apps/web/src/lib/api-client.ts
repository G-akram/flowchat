import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? '/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(err: unknown, token: string | null): void {
  refreshQueue.forEach((promise) => {
    if (err) {
      promise.reject(err);
    } else if (token) {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.response && error.code === 'ERR_NETWORK') {
      toast.error('Network error', {
        description: 'Unable to reach the server. Check your connection.',
        id: 'network-error',
      });
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<{ data: { accessToken: string } }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = response.data.data.accessToken;
      setAccessToken(newToken);
      processQueue(null, newToken);

      originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      processQueue(refreshError, null);
      return Promise.reject(refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
    } finally {
      isRefreshing = false;
    }
  }
);
