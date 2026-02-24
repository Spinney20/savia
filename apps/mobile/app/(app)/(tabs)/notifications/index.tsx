import { useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotifications, useMarkAsRead } from '@/hooks/use-notifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { EmptyState, SkeletonList, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications({ limit: 50 });
  const markAsRead = useMarkAsRead();

  const notifications = data?.data ?? [];

  const handlePress = useCallback(
    (uuid: string) => {
      markAsRead.mutate(uuid);
    },
    [markAsRead],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <SkeletonList count={8} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState
          title="Eroare"
          description="Nu am putut încărca notificările."
          onRetry={refetch}
        />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <EmptyState
          title="Nicio notificare"
          description="Nu aveți notificări noi."
          icon={Bell}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={() => handlePress(item.uuid)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary.DEFAULT}
            colors={[colors.primary.DEFAULT]}
          />
        }
      />
    </View>
  );
}
