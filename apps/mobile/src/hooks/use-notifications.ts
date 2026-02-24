import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDto } from '@ssm/shared';
import type { ListParams } from '@ssm/api-client';
import { api } from '@/lib/api';

export function useNotifications(params?: ListParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => api.notifications.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.notifications.getUnreadCount(),
    refetchInterval: 30_000, // Poll every 30s
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => api.notifications.markAsRead(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
