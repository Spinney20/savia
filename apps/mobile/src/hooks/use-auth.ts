import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ActivateAccountInput,
  ChangePasswordInput,
} from '@ssm/shared';
import { api } from '@/lib/api';
import { secureTokenStorage } from '@/services/token-storage';
import { useAuthStore } from '@/stores/auth.store';
import Toast from 'react-native-toast-message';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const tokens = await api.auth.login(input);
      await secureTokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await api.auth.getMe();
      return me;
    },
    onSuccess: (me) => {
      setUser(me);
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Autentificare eșuată', text2: 'Email sau parolă incorecte.' });
    },
  });
}

export function useLogout() {
  const clearUser = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.auth.logout();
      } catch {
        // Logout may fail if token already expired — that's fine
      }
    },
    onSettled: () => {
      clearUser();
      queryClient.clear();
    },
  });
}

export function useGetMe() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const me = await api.auth.getMe();
      setUser(me);
      return me;
    },
    staleTime: 5 * 60_000, // 5 min
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => api.auth.forgotPassword(input),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Email trimis', text2: 'Verificați inbox-ul pentru linkul de resetare.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu am putut trimite emailul de resetare.' });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => api.auth.resetPassword(input),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Parolă resetată', text2: 'Vă puteți autentifica cu noua parolă.' });
    },
  });
}

export function useActivate() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: ActivateAccountInput) => {
      const tokens = await api.auth.activate(input);
      await secureTokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await api.auth.getMe();
      return me;
    },
    onSuccess: (me) => {
      setUser(me);
      Toast.show({ type: 'success', text1: 'Cont activat', text2: 'Bine ați venit!' });
    },
  });
}

export function useChangePassword() {
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => api.auth.changePassword(input),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Parolă schimbată', text2: 'Vă rugăm să vă autentificați din nou.' });
      clearUser();
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Parola curentă este incorectă.' });
    },
  });
}
