import { create } from 'zustand';
import type { AuthMeResponse } from '@ssm/shared';
import { api } from '@/lib/api';
import { electronTokenStorage } from '@/services/token-storage';

interface AuthState {
  user: AuthMeResponse | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
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
      const token = await electronTokenStorage.getAccessToken();
      if (!token) {
        set({ isHydrated: true, isAuthenticated: false, user: null });
        return;
      }
      const me = await api.auth.getMe();
      set({ user: me, isAuthenticated: true, isHydrated: true });
    } catch {
      await electronTokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isHydrated: true });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearUser: () => {
    electronTokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
