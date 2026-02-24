import { useRef } from 'react';
import { Pressable, ActivityIndicator, type PressableProps, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: string;
}

const variantStyles: Record<Variant, { base: string; pressed: string; text: string }> = {
  primary: {
    base: 'bg-primary',
    pressed: 'bg-primary-800',
    text: 'text-white',
  },
  secondary: {
    base: 'bg-primary-50',
    pressed: 'bg-primary-100',
    text: 'text-primary',
  },
  outline: {
    base: 'bg-transparent border border-gray-300',
    pressed: 'bg-gray-50 border border-gray-300',
    text: 'text-gray-700',
  },
  ghost: {
    base: 'bg-transparent',
    pressed: 'bg-gray-100',
    text: 'text-gray-700',
  },
  danger: {
    base: 'bg-danger',
    pressed: 'bg-danger-600',
    text: 'text-white',
  },
};

const sizeStyles: Record<Size, { container: string; text: 'button' | 'buttonSmall'; iconSize: number }> = {
  sm: { container: 'px-3 py-2 rounded-lg', text: 'buttonSmall', iconSize: 16 },
  md: { container: 'px-5 py-3 rounded-xl', text: 'button', iconSize: 20 },
  lg: { container: 'px-6 py-4 rounded-xl', text: 'button', iconSize: 20 },
};

const DEBOUNCE_MS = 400;

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  disabled,
  onPress,
  className = '',
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;
  const lastPressRef = useRef(0);

  const handlePress = (e: any) => {
    if (isDisabled) return;
    const now = Date.now();
    if (now - lastPressRef.current < DEBOUNCE_MS) return;
    lastPressRef.current = now;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available (simulator/no hardware)
    }
    onPress?.(e);
  };

  const iconColor = variant === 'primary' || variant === 'danger' ? colors.white : colors.primary.DEFAULT;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={`${ss.container} ${className}`}
      {...props}
    >
      {({ pressed }) => (
        <View
          className={`flex-row items-center justify-center ${pressed && !isDisabled ? vs.pressed : vs.base} ${ss.container}`}
          style={{ opacity: isDisabled ? 0.5 : 1 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <>
              {Icon && iconPosition === 'left' && (
                <Icon size={ss.iconSize} color={iconColor} style={{ marginRight: 8 }} />
              )}
              <Text variant={ss.text} className={vs.text}>{children}</Text>
              {Icon && iconPosition === 'right' && (
                <Icon size={ss.iconSize} color={iconColor} style={{ marginLeft: 8 }} />
              )}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
