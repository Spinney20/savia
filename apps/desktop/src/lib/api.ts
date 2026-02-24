import { createApiClient } from '@ssm/api-client';
import { electronTokenStorage } from '@/services/token-storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = createApiClient({
  baseUrl: API_URL,
  tokenStorage: electronTokenStorage,
  onUnauthorized: () => {
    import('@/stores/auth.store').then(({ useAuthStore }) => {
      useAuthStore.getState().clearUser();
    });
  },
});
