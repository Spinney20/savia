import type { Readable } from 'node:stream';

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface UploadParams {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export abstract class StorageService {
  abstract upload(params: UploadParams): Promise<string>;
  abstract getSignedUrl(key: string): Promise<string>;
  abstract delete(key: string): Promise<void>;
  abstract getStream(key: string): Promise<Readable>;
}
