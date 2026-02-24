import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — construction site data changes moderately
      gcTime: 10 * 60_000,      // 10min garbage collection
      retry: 2,
      refetchOnWindowFocus: false, // Mobile doesn't have window focus
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
