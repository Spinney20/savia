import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LoginInput,
  ForgotPasswordInput,
  ChangePasswordInput,
  ActivateAccountInput,
  ResetPasswordInput,
} from '@ssm/shared';
import { api } from '@/lib/api';
import { electronTokenStorage } from '@/services/token-storage';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const tokens = await api.auth.login(input);
      await electronTokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await api.auth.getMe();
      return me;
    },
    onSuccess: (me) => {
      setUser(me);
    },
    onError: () => {
      toast.error('Autentificare eșuată', { description: 'Email sau parolă incorecte.' });
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
        // Logout may fail if token already expired
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
    staleTime: 5 * 60_000,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => api.auth.forgotPassword(input),
    onSuccess: () => {
      toast.success('Email trimis', { description: 'Verificați inbox-ul pentru linkul de resetare.' });
    },
    onError: () => {
      toast.error('Eroare', { description: 'Nu am putut trimite emailul de resetare.' });
    },
  });
}

export function useChangePassword() {
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => api.auth.changePassword(input),
    onSuccess: () => {
      toast.success('Parolă schimbată', { description: 'Vă rugăm să vă autentificați din nou.' });
      clearUser();
    },
    onError: () => {
      toast.error('Eroare', { description: 'Parola curentă este incorectă.' });
    },
  });
}

export function useActivateAccount() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: ActivateAccountInput) => {
      const tokens = await api.auth.activate(input);
      await electronTokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await api.auth.getMe();
      return me;
    },
    onSuccess: (me) => {
      setUser(me);
      toast.success('Cont activat', { description: 'Contul dvs. a fost activat cu succes.' });
    },
    onError: () => {
      toast.error('Eroare', { description: 'Linkul de activare este invalid sau a expirat.' });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => api.auth.resetPassword(input),
    onSuccess: () => {
      toast.success('Parolă resetată', { description: 'Puteți acum să vă autentificați cu noua parolă.' });
    },
    onError: () => {
      toast.error('Eroare', { description: 'Linkul de resetare este invalid sau a expirat.' });
    },
  });
}
