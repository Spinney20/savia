import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const buffer = await file.arrayBuffer();
      return api.upload.upload({
        buffer: new Blob([buffer], { type: file.type }),
        fileName: file.name,
        mimeType: file.type,
      });
    },
    onError: () => toast.error('Nu am putut încărca fișierul.'),
  });
}
