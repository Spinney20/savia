import type { PaginatedResponse, NotificationDto } from '@ssm/shared';
import type { HttpClient } from '../client.js';
import type { ListParams } from '../types.js';

export class NotificationsEndpoints {
  constructor(private readonly http: HttpClient) {}

  /** GET /notifications */
  async list(params?: ListParams): Promise<PaginatedResponse<NotificationDto>> {
    return this.http.get<PaginatedResponse<NotificationDto>>('/notifications', params);
  }

  /** GET /notifications/unread-count */
  async getUnreadCount(): Promise<{ count: number }> {
    return this.http.get<{ count: number }>('/notifications/unread-count');
  }

  /** PATCH /notifications/:uuid/read */
  async markAsRead(uuid: string): Promise<{ message: string }> {
    return this.http.patch<{ message: string }>(`/notifications/${uuid}/read`);
  }
}
