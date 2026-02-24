import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { api } from '@/lib/api';
import { useSyncStore, type PendingItem } from '@/stores/sync.store';
import { queryClient } from '@/lib/query-client';

const MAX_RETRIES = 3;

/** Upload a local photo file and return its attachment UUID */
async function uploadLocalPhoto(uri: string): Promise<string> {
  // React Native fetch supports file:// URIs natively via FormData
  const fileName = `photo_${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: fileName,
  } as any);

  const { API_URL: apiUrl } = await import('@/lib/api');
  const { secureTokenStorage } = await import('@/services/token-storage');
  const token = await secureTokenStorage.getAccessToken();

  const response = await fetch(`${apiUrl}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  const json = await response.json();
  return json.data.uuid;
}

async function syncSingleItem(item: PendingItem): Promise<void> {
  // 1. Upload any local photos first
  const attachmentUuids: string[] = [];
  if (item.localPhotos?.length) {
    for (const photoUri of item.localPhotos) {
      const uuid = await uploadLocalPhoto(photoUri);
      attachmentUuids.push(uuid);
    }
  }

  // 2. Call the appropriate API endpoint
  const payload = { ...item.data };
  if (attachmentUuids.length > 0) {
    (payload as any).attachmentUuids = attachmentUuids;
  }

  switch (item.type) {
    case 'CREATE_ISSUE':
      await api.issues.create(payload as any);
      break;
    case 'CREATE_INSPECTION':
      await api.inspections.create(payload as any);
      break;
    case 'CREATE_TRAINING':
      await api.trainings.create(payload as any);
      break;
    case 'CONFIRM_TRAINING': {
      const { trainingUuid, ...rest } = payload as any;
      await api.trainings.confirm(trainingUuid, rest);
      break;
    }
  }

  // 3. Cleanup local photo files
  for (const photoUri of item.localPhotos ?? []) {
    try {
      await FileSystem.deleteAsync(photoUri, { idempotent: true });
    } catch {
      // Non-critical: file may already be cleaned up
    }
  }
}

/** Process all pending items in the sync queue */
export async function syncAllPendingItems(): Promise<void> {
  const store = useSyncStore.getState();
  if (store.isSyncing) return;

  // Snapshot only retryable items
  const retryableItems = store.pendingItems.filter((i) => i.retryCount < MAX_RETRIES);
  if (retryableItems.length === 0) {
    // Notify about dead letters if any
    const deadCount = store.pendingItems.length;
    if (deadCount > 0) {
      Toast.show({
        type: 'error',
        text1: 'Sincronizare eșuată',
        text2: `${deadCount} element${deadCount > 1 ? 'e' : ''} nu au putut fi sincronizat${deadCount > 1 ? 'e' : ''}. Verificați în Setări.`,
      });
    }
    return;
  }

  store.setSyncing(true);
  let synced = 0;
  let failed = 0;

  for (const item of retryableItems) {
    try {
      await syncSingleItem(item);
      useSyncStore.getState().removePending(item.id);
      synced++;
    } catch {
      useSyncStore.getState().incrementRetry(item.id);
      failed++;
    }
  }

  useSyncStore.getState().setSyncing(false);

  // Invalidate relevant caches
  if (synced > 0) {
    queryClient.invalidateQueries({ queryKey: ['issues'] });
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
    queryClient.invalidateQueries({ queryKey: ['trainings'] });
    Toast.show({
      type: 'success',
      text1: 'Sincronizare completă',
      text2: `${synced} element${synced > 1 ? 'e' : ''} sincronizat${synced > 1 ? 'e' : ''}.`,
    });
  }

  // Notify about newly dead-lettered items
  const newDeadCount = useSyncStore.getState().deadLetterCount();
  if (newDeadCount > 0 && failed > 0) {
    Toast.show({
      type: 'error',
      text1: 'Erori de sincronizare',
      text2: `${newDeadCount} element${newDeadCount > 1 ? 'e' : ''} au eșuat definitiv.`,
    });
  }
}
