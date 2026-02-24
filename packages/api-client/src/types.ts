export type { TokenResponse, UploadResponse, FileMetaResponse } from '@ssm/shared';

/**
 * Token storage abstraction — consumers (mobile/desktop) provide their own implementation
 * (e.g. expo-secure-store, electron-store, etc.)
 */
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface ApiClientConfig {
  /** Base URL including /api prefix, e.g. "http://localhost:3000/api" */
  baseUrl: string;
  tokenStorage: TokenStorage;
  /** Called when refresh also fails — consumers should force logout / navigate to login */
  onUnauthorized?: () => void;
}

/** Query params for paginated list endpoints */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

/** Cross-platform file input for uploads */
export interface FileInput {
  buffer: Blob;
  fileName: string;
  mimeType: string;
}
