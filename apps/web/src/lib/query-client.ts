import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount: number, error: unknown): boolean => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { status?: number } }).response?.status === 'number'
        ) {
          const status = (error as { response: { status: number } }).response.status;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
