import { createApiClient } from '@ssm/api-client';
import { secureTokenStorage } from '@/services/token-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** Global API client singleton — used by all TanStack Query hooks */
export const api = createApiClient({
  baseUrl: API_URL,
  tokenStorage: secureTokenStorage,
  onUnauthorized: () => {
    // Auth store will handle redirect — imported lazily to avoid circular deps
    import('@/stores/auth.store').then(({ useAuthStore }) => {
      useAuthStore.getState().clearUser();
    });
  },
});
