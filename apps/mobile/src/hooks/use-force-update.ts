import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Check if app version meets minimum required version from API */
export function useForceUpdate() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const minVersion = (user as any).minAppVersion;
    if (!minVersion) return;

    const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
    if (compareVersions(currentVersion, minVersion) < 0) {
      router.replace('/force-update');
    }
  }, [user, router]);
}
