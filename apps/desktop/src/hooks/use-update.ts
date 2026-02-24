import { useState, useEffect } from 'react';

interface UpdateInfo {
  available: boolean;
  version?: string;
  downloading?: boolean;
  downloaded?: boolean;
}

export function useUpdate() {
  const [update, setUpdate] = useState<UpdateInfo>({ available: false });

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.onUpdateAvailable?.((info) => {
      setUpdate({ available: true, version: info.version });
    });

    api.onUpdateDownloaded?.(() => {
      setUpdate((prev) => ({ ...prev, downloaded: true, downloading: false }));
    });
  }, []);

  const checkForUpdates = () => {
    window.electronAPI?.checkForUpdates?.();
  };

  const downloadUpdate = () => {
    setUpdate((prev) => ({ ...prev, downloading: true }));
    window.electronAPI?.downloadUpdate?.();
  };

  return { update, checkForUpdates, downloadUpdate };
}
