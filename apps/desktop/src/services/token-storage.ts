import type { TokenStorage } from '@ssm/api-client';

export const electronTokenStorage: TokenStorage = {
  async getAccessToken() {
    return window.electronAPI.getToken('access_token');
  },
  async getRefreshToken() {
    return window.electronAPI.getToken('refresh_token');
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await window.electronAPI.saveToken('access_token', accessToken);
    await window.electronAPI.saveToken('refresh_token', refreshToken);
  },
  async clearTokens() {
    await window.electronAPI.deleteToken('access_token');
    await window.electronAPI.deleteToken('refresh_token');
  },
};
