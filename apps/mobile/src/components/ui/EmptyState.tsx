import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { Text } from './Text';
import { Button } from './Button';
import { colors } from '@/theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 py-16 ${className}`}>
      <View className="bg-gray-100 rounded-full p-5 mb-5">
        <Icon size={48} color={colors.gray[400]} strokeWidth={1.5} />
      </View>
      <Text variant="h3" className="text-center text-gray-800 mb-2">{title}</Text>
      {description && (
        <Text variant="bodySmall" className="text-center text-gray-500 mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  );
}
