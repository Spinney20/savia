import { useAppStore } from '@/stores/app.store';

/** Simple hook to access current network state */
export function useNetwork() {
  const isOnline = useAppStore((s) => s.isOnline);
  return { isOnline };
}
