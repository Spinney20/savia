interface ElectronAPI {
  saveToken: (key: string, value: string) => Promise<void>;
  getToken: (key: string) => Promise<string | null>;
  deleteToken: (key: string) => Promise<void>;
  saveFile: (data: ArrayBuffer | Uint8Array, defaultName: string) => Promise<string | null>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  onUpdateAvailable: (callback: (info: { version: string }) => void) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  [key: string]: string | boolean | undefined;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
