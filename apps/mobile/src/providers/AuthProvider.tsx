import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { setupNetworkListener } from '@/services/network.service';
import { setupNotificationListeners } from '@/services/notification.service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Network listener — always active
  useEffect(() => {
    const unsubscribe = setupNetworkListener();
    return unsubscribe;
  }, []);

  // Notification tap listener — active when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = setupNotificationListeners();
    return unsubscribe;
  }, [isAuthenticated]);

  // Children handle the loading state via isHydrated check in root layout
  return <>{children}</>;
}
