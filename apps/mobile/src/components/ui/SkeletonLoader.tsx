import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function SkeletonLoader({ width, height = 16, borderRadius = 8, className = '' }: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.ease }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-gray-200 ${className}`}
      style={[
        animatedStyle,
        { width: width ?? '100%', height, borderRadius },
      ]}
    />
  );
}

/** Pre-composed skeleton for a list card */
export function SkeletonCard() {
  return (
    <View className="bg-white rounded-card p-4 gap-3" style={{ elevation: 2 }}>
      <View className="flex-row items-center gap-3">
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View className="flex-1 gap-2">
          <SkeletonLoader height={14} width="70%" />
          <SkeletonLoader height={12} width="40%" />
        </View>
      </View>
      <SkeletonLoader height={12} />
      <SkeletonLoader height={12} width="60%" />
    </View>
  );
}

/** Pre-composed skeleton for list screens */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View className="gap-3 px-4 pt-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
