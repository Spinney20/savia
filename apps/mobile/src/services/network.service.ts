import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '@/stores/app.store';
import { syncAllPendingItems } from './sync.service';

let unsubscribe: (() => void) | null = null;

/** Start listening for network changes. Call once on app mount. */
export function setupNetworkListener(): () => void {
  if (unsubscribe) return unsubscribe;

  unsubscribe = NetInfo.addEventListener((state) => {
    const wasOffline = !useAppStore.getState().isOnline;
    const isNowOnline = state.isConnected ?? false;

    useAppStore.getState().setOnline(isNowOnline);

    // Trigger sync when coming back online
    if (wasOffline && isNowOnline) {
      syncAllPendingItems();
    }
  });

  return unsubscribe;
}
