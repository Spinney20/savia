import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/lib/mmkv';

export interface PendingItem {
  id: string;
  type: 'CREATE_ISSUE' | 'CREATE_INSPECTION' | 'CREATE_TRAINING' | 'CONFIRM_TRAINING';
  data: Record<string, unknown>;
  localPhotos: string[];
  createdAt: string;
  retryCount: number;
}

const MAX_RETRIES = 3;

interface SyncState {
  pendingItems: PendingItem[];
  isSyncing: boolean;
  addPending: (item: Omit<PendingItem, 'id' | 'createdAt' | 'retryCount'>) => void;
  removePending: (id: string) => void;
  incrementRetry: (id: string) => void;
  setSyncing: (v: boolean) => void;
  pendingCount: () => number;
  /** Count of items that have exceeded max retries and are stuck */
  deadLetterCount: () => number;
  /** Remove all items that have exceeded max retries */
  clearDeadLetters: () => void;
  /** Retry a specific dead-letter item (resets retryCount) */
  retryItem: (id: string) => void;
}

function generateId(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `pending_${Date.now()}_${random}`;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingItems: [],
      isSyncing: false,

      addPending: (item) => set((state) => ({
        pendingItems: [
          ...state.pendingItems,
          {
            ...item,
            id: generateId(),
            createdAt: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      })),

      removePending: (id) => set((state) => ({
        pendingItems: state.pendingItems.filter((i) => i.id !== id),
      })),

      incrementRetry: (id) => set((state) => ({
        pendingItems: state.pendingItems.map((i) =>
          i.id === id ? { ...i, retryCount: i.retryCount + 1 } : i,
        ),
      })),

      setSyncing: (isSyncing) => set({ isSyncing }),

      pendingCount: () => get().pendingItems.filter((i) => i.retryCount < MAX_RETRIES).length,

      deadLetterCount: () => get().pendingItems.filter((i) => i.retryCount >= MAX_RETRIES).length,

      clearDeadLetters: () => set((state) => ({
        pendingItems: state.pendingItems.filter((i) => i.retryCount < MAX_RETRIES),
      })),

      retryItem: (id) => set((state) => ({
        pendingItems: state.pendingItems.map((i) =>
          i.id === id ? { ...i, retryCount: 0 } : i,
        ),
      })),
    }),
    {
      name: 'ssm-sync-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ pendingItems: state.pendingItems }),
    },
  ),
);
