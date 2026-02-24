import { View, Pressable, type ViewProps, type PressableProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: PressableProps['onPress'];
  padded?: boolean;
}

export function Card({ onPress, padded = true, className = '', children, ...props }: CardProps) {
  const base = `bg-white rounded-card ${padded ? 'p-4' : ''} ${className}`;

  // Android shadow via elevation, iOS via shadow classes
  const shadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={base}
        style={({ pressed }) => [shadowStyle, { opacity: pressed ? 0.95 : 1 }]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={base} style={shadowStyle} {...props}>
      {children}
    </View>
  );
}
