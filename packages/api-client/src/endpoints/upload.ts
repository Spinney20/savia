import type { UploadResponse, FileMetaResponse } from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { FileInput } from '../types.js';

export class UploadEndpoints {
  constructor(private readonly http: HttpClient) {}

  /** POST /upload — multipart/form-data file upload (web / Blob-based) */
  async upload(file: FileInput): Promise<UploadResponse> {
    return this.http.uploadFile<UploadResponse>('/upload', file.buffer, file.fileName);
  }

  /** POST /upload — multipart/form-data file upload (React Native URI-based) */
  async uploadNative(uri: string, fileName: string, mimeType: string): Promise<UploadResponse> {
    return this.http.uploadNative<UploadResponse>('/upload', uri, fileName, mimeType);
  }

  /** GET /files/:uuid — returns file metadata */
  async getFile(uuid: string): Promise<FileMetaResponse> {
    return this.http.get<FileMetaResponse>(`/files/${uuid}`);
  }

  /** GET /files/:uuid/download — returns raw binary stream */
  async downloadFile(uuid: string): Promise<Response> {
    return this.http.getRaw(`/files/${uuid}/download`);
  }
}
