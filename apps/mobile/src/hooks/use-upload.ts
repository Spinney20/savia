import { useMutation } from '@tanstack/react-query';
import type { UploadResponse } from '@ssm/shared';
import { api } from '@/lib/api';

interface UploadInput {
  uri: string;
  mimeType?: string;
  fileName?: string;
}

/**
 * Upload a file from a local URI (React Native specific).
 * Uses api-client's uploadNative which handles auth + refresh automatically.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: (input: UploadInput): Promise<UploadResponse> =>
      api.upload.uploadNative(
        input.uri,
        input.fileName ?? `upload_${Date.now()}.jpg`,
        input.mimeType ?? 'image/jpeg',
      ),
  });
}
