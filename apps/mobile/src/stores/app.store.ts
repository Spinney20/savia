import { create } from 'zustand';

interface AppState {
  isOnline: boolean;
  currentSite: { uuid: string; name: string } | null;
  setOnline: (v: boolean) => void;
  setCurrentSite: (site: { uuid: string; name: string } | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true,
  currentSite: null,
  setOnline: (isOnline) => set({ isOnline }),
  setCurrentSite: (currentSite) => set({ currentSite }),
}));
