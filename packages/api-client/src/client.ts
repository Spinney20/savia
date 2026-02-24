import type { ApiClientConfig, TokenStorage, ListParams } from './types.js';
import { ApiError } from './errors.js';

interface RequestOptions {
  body?: unknown;
  query?: ListParams;
  /** Skip Authorization header (for public endpoints like login) */
  isPublic?: boolean;
  /** Raw response — skip JSON unwrapping (for file downloads) */
  raw?: boolean;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: TokenStorage;
  private readonly onUnauthorized?: () => void;
  private isRefreshing = false;

  constructor(config: ApiClientConfig) {
    // Strip trailing slash
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.tokenStorage = config.tokenStorage;
    this.onUnauthorized = config.onUnauthorized;
  }

  async get<T>(path: string, query?: ListParams): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  async del<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  async postPublic<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body, isPublic: true });
  }

  async getRaw(path: string): Promise<Response> {
    return this.request<Response>('GET', path, { raw: true });
  }

  /** Upload for React Native — uses { uri, type, name } FormData format */
  async uploadNative<T>(path: string, uri: string, fileName: string, mimeType: string, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, { uri, type: mimeType, name: fileName } as unknown as Blob);

    const token = await this.tokenStorage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401 && !this.isRefreshing) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.uploadNative<T>(path, uri, fileName, mimeType, fieldName);
      }
    }

    if (!response.ok) {
      await this.throwApiError(response);
    }

    const json = await response.json() as { data: T };
    return json.data;
  }

  async uploadFile<T>(path: string, file: Blob, fileName: string, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file, fileName);

    const token = await this.tokenStorage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401 && !this.isRefreshing) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.uploadFile<T>(path, file, fileName, fieldName);
      }
    }

    if (!response.ok) {
      await this.throwApiError(response);
    }

    const json = await response.json() as { data: T };
    return json.data;
  }

  private async request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    const { body, query, isPublic, raw } = options ?? {};

    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {};

    if (!isPublic) {
      const token = await this.tokenStorage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // 401 → try refresh once, then retry
    if (response.status === 401 && !isPublic && !this.isRefreshing) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(method, path, options);
      }
    }

    if (!response.ok) {
      // 204 No Content is still ok, caught above — but DELETE may return 200 with no body
      if (response.status === 204) {
        return undefined as T;
      }
      await this.throwApiError(response);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    if (raw) {
      return response as T;
    }

    const json = await response.json() as { data: T };
    return json.data;
  }

  private async tryRefresh(): Promise<boolean> {
    this.isRefreshing = true;
    try {
      const refreshToken = await this.tokenStorage.getRefreshToken();
      if (!refreshToken) {
        await this.tokenStorage.clearTokens();
        this.onUnauthorized?.();
        return false;
      }

      const url = `${this.baseUrl}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.tokenStorage.clearTokens();
        this.onUnauthorized?.();
        return false;
      }

      const json = await response.json() as { data: { accessToken: string; refreshToken: string } };
      await this.tokenStorage.setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      await this.tokenStorage.clearTokens();
      this.onUnauthorized?.();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async throwApiError(response: Response): Promise<never> {
    let message = `Request failed with status ${response.status}`;
    let details: Record<string, string[]> | undefined;

    try {
      const json = await response.json() as { data?: { message?: string; details?: Record<string, string[]> }; message?: string; details?: Record<string, string[]> };
      // Error responses may or may not be wrapped in { data }
      const body = json.data ?? json;
      if (body.message) message = body.message;
      if (body.details) details = body.details;
    } catch {
      // Response body isn't JSON — keep default message
    }

    throw new ApiError(response.status, message, details);
  }
}
