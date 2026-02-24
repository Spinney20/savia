import { create } from 'zustand';
import type { AuthMeResponse } from '@ssm/shared';
import { api } from '@/lib/api';
import { secureTokenStorage } from '@/services/token-storage';

interface AuthState {
  user: AuthMeResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  /** Called once on app mount — checks SecureStore for existing tokens */
  hydrate: () => Promise<void>;
  setUser: (user: AuthMeResponse) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await secureTokenStorage.getAccessToken();
      if (!token) {
        set({ isHydrated: true, isAuthenticated: false, user: null });
        return;
      }

      // Validate token by fetching user profile
      const me = await api.auth.getMe();
      set({ user: me, isAuthenticated: true, isHydrated: true });
    } catch {
      // Token invalid or expired (refresh also failed)
      await secureTokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isHydrated: true });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearUser: async () => {
    await secureTokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
