import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { SyncBadge } from './SyncBadge';
import { colors } from '@/theme';

interface HeaderProps {
  title: string;
  showNotifications?: boolean;
  unreadCount?: number;
}

export function Header({ title, showNotifications = true, unreadCount = 0 }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <Text variant="h3" className="text-gray-900">{title}</Text>
      <View className="flex-row items-center gap-3">
        <SyncBadge />
        {showNotifications && (
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/notifications')}
            className="relative"
            hitSlop={8}
          >
            <Bell size={24} color={colors.gray[700]} />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-danger w-4 h-4 rounded-full items-center justify-center">
                <Text variant="caption" className="text-white text-[10px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
