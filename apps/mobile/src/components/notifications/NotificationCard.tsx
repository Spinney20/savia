import { View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  Bell,
  FileText,
  Info,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { NotificationDto } from '@ssm/shared';
import { Card, Text } from '@/components/ui';
import { colors } from '@/theme';

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  ISSUE: { icon: AlertTriangle, color: colors.warning },
  INSPECTION: { icon: ClipboardCheck, color: colors.primary.DEFAULT },
  TRAINING: { icon: GraduationCap, color: colors.success },
  DOCUMENT: { icon: FileText, color: colors.info },
  SYSTEM: { icon: Info, color: colors.gray[500] },
};

interface NotificationCardProps {
  notification: NotificationDto;
  onPress?: () => void;
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const isUnread = !notification.readAt;
  const typeConfig = TYPE_ICONS[notification.notificationType] ?? { icon: Bell, color: colors.gray[500] };
  const Icon = typeConfig.icon;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ro });

  return (
    <Card onPress={onPress} className={isUnread ? 'border-l-4 border-l-primary' : ''}>
      <View className="flex-row gap-3">
        <View
          className="rounded-full p-2 mt-0.5"
          style={{ backgroundColor: typeConfig.color + '15' }}
        >
          <Icon size={18} color={typeConfig.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text
              variant="bodySmall"
              className={isUnread ? 'font-bold text-gray-900 flex-1' : 'text-gray-900 flex-1'}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {isUnread && (
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </View>
          <Text variant="bodySmall" muted numberOfLines={2} className="mb-1">
            {notification.body}
          </Text>
          <Text variant="caption" muted>{timeAgo}</Text>
        </View>
      </View>
    </Card>
  );
}