import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveToken: (key: string, value: string) =>
    ipcRenderer.invoke('auth:save-token', key, value),
  getToken: (key: string) =>
    ipcRenderer.invoke('auth:get-token', key),
  deleteToken: (key: string) =>
    ipcRenderer.invoke('auth:delete-token', key),
  saveFile: (data: ArrayBuffer, defaultName: string) =>
    ipcRenderer.invoke('file:save-dialog', data, defaultName),
  checkForUpdates: () =>
    ipcRenderer.invoke('update:check'),
  downloadUpdate: () =>
    ipcRenderer.invoke('update:download'),
  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) => callback(info);
    ipcRenderer.on('update:available', handler);
    return () => ipcRenderer.removeListener('update:available', handler);
  },
  onUpdateDownloaded: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('update:downloaded', handler);
    return () => ipcRenderer.removeListener('update:downloaded', handler);
  },
});
