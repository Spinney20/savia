import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Card, Text } from '@/components/ui';
import { colors } from '@/theme';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  onPress?: () => void;
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = colors.primary.DEFAULT, onPress }: KpiCardProps) {
  return (
    <Card className="flex-1 min-w-[140px]" onPress={onPress}>
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon size={18} color={color} />
        </View>
      </View>
      <Text variant="h2" className="text-gray-900">{value}</Text>
      <Text variant="bodySmall" muted className="mt-0.5">{title}</Text>
      {subtitle && <Text variant="caption" muted>{subtitle}</Text>}
    </Card>
  );
}
