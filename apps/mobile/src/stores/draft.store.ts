import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/lib/mmkv';

interface DraftState {
  inspectionDrafts: Record<string, unknown>;
  issueDrafts: Record<string, unknown>;
  saveDraft: (type: 'inspection' | 'issue', id: string, data: unknown) => void;
  getDraft: (type: 'inspection' | 'issue', id: string) => unknown | null;
  clearDraft: (type: 'inspection' | 'issue', id: string) => void;
  clearAllDrafts: () => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      inspectionDrafts: {},
      issueDrafts: {},

      saveDraft: (type, id, data) => set((state) => {
        const key = type === 'inspection' ? 'inspectionDrafts' : 'issueDrafts';
        return { [key]: { ...state[key], [id]: data } };
      }),

      getDraft: (type, id) => {
        const store = type === 'inspection' ? get().inspectionDrafts : get().issueDrafts;
        return store[id] ?? null;
      },

      clearDraft: (type, id) => set((state) => {
        const key = type === 'inspection' ? 'inspectionDrafts' : 'issueDrafts';
        const { [id]: _, ...rest } = state[key] as Record<string, unknown>;
        return { [key]: rest };
      }),

      clearAllDrafts: () => set({ inspectionDrafts: {}, issueDrafts: {} }),
    }),
    {
      name: 'ssm-draft-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
