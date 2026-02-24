/**
 * Generic API response types
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, string[]>;
}

/** Sort direction for pagination queries */
export type SortDirection = 'asc' | 'desc';

/** Attachment DTO */
export interface AttachmentDto {
  uuid: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

/** Token pair returned by login, refresh, activate */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/** Response from POST /upload */
export interface UploadResponse {
  uuid: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

/** Response from GET /files/:uuid */
export interface FileMetaResponse {
  url: string;
  fileName: string;
  mimeType: string;
}

/** Notification DTO */
export interface NotificationDto {
  uuid: string;
  title: string;
  body: string;
  notificationType: string;
  readAt: string | null;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: string;
}
