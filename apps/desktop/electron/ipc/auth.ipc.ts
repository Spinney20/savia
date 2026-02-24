import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';

const store = new Store({ name: 'secure-tokens' });

export function registerAuthIpc(): void {
  ipcMain.handle('auth:save-token', async (_event, key: string, value: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value);
      store.set(key, encrypted.toString('base64'));
    } else {
      store.set(key, value);
    }
  });

  ipcMain.handle('auth:get-token', async (_event, key: string) => {
    const stored = store.get(key) as string | undefined;
    if (!stored) return null;
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(stored, 'base64'));
      } catch {
        store.delete(key);
        return null;
      }
    }
    return stored;
  });

  ipcMain.handle('auth:delete-token', async (_event, key: string) => {
    store.delete(key);
  });
}
