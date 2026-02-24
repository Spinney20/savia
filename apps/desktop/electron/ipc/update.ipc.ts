import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

export function registerUpdateIpc(): void {
  ipcMain.handle('update:check', async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.handle('update:download', async () => {
    await autoUpdater.downloadUpdate();
  });
}
