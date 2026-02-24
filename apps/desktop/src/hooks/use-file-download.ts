import { useState } from 'react';
import { toast } from 'sonner';

export function useFileDownload() {
  const [downloading, setDownloading] = useState(false);

  const download = async (url: string, fileName: string) => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      if (window.electronAPI?.saveFile) {
        await window.electronAPI.saveFile(new Uint8Array(buffer), fileName);
        toast.success('Fișier salvat');
      } else {
        // Fallback for browser
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      toast.error('Nu am putut descărca fișierul.');
    } finally {
      setDownloading(false);
    }
  };

  return { download, downloading };
}
