import { View } from 'react-native';
import { Text } from './Text';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ label, color = 'text-gray-700', bgColor = 'bg-gray-100', size = 'sm', className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  return (
    <View className={`rounded-full ${sizeClass} ${bgColor} ${className}`}>
      <Text variant="caption" className={`font-semibold ${color}`}>{label}</Text>
    </View>
  );
}
