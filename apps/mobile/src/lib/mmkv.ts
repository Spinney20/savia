import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const mmkvStorage = new MMKV({ id: 'ssm-mobile' });

/** Zustand persist adapter for MMKV */
export const zustandMMKVStorage: StateStorage = {
  getItem: (name) => mmkvStorage.getString(name) ?? null,
  setItem: (name, value) => mmkvStorage.set(name, value),
  removeItem: (name) => mmkvStorage.delete(name),
};
