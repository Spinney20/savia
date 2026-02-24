import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme';
import { Text } from './Text';

interface SpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Spinner({ size = 'large', message, fullScreen = false, className = '' }: SpinnerProps) {
  const content = (
    <View className={`items-center justify-center gap-3 ${className}`}>
      <ActivityIndicator size={size} color={colors.primary.DEFAULT} />
      {message && <Text variant="bodySmall" muted>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 items-center justify-center">{content}</View>;
  }

  return content;
}
