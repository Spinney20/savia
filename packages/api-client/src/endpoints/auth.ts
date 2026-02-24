import type {
  LoginInput,
  ActivateAccountInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthMeResponse,
} from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { TokenResponse } from '../types.js';

export class AuthEndpoints {
  constructor(private readonly http: HttpClient) {}

  /** POST /auth/login — public */
  async login(input: LoginInput): Promise<TokenResponse> {
    const tokens = await this.http.postPublic<TokenResponse>('/auth/login', input);
    return tokens;
  }

  /** POST /auth/refresh — uses stored refresh token */
  async refresh(): Promise<TokenResponse> {
    // This is handled internally by HttpClient.tryRefresh() on 401,
    // but exposed here for explicit manual refresh if needed.
    return this.http.post<TokenResponse>('/auth/refresh');
  }

  /** POST /auth/logout */
  async logout(): Promise<void> {
    await this.http.post<void>('/auth/logout');
  }

  /** GET /auth/me */
  async getMe(): Promise<AuthMeResponse> {
    return this.http.get<AuthMeResponse>('/auth/me');
  }

  /** POST /auth/activate — public */
  async activate(input: ActivateAccountInput): Promise<TokenResponse> {
    const tokens = await this.http.postPublic<TokenResponse>('/auth/activate', input);
    return tokens;
  }

  /** POST /auth/change-password */
  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    return this.http.post<{ message: string }>('/auth/change-password', input);
  }

  /** POST /auth/forgot-password — public */
  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    return this.http.postPublic<{ message: string }>('/auth/forgot-password', input);
  }

  /** POST /auth/reset-password — public */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    return this.http.postPublic<{ message: string }>('/auth/reset-password', input);
  }
}
