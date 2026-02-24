import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme';

interface FABProps {
  onPress: () => void;
  icon?: LucideIcon;
  className?: string;
}

export function FAB({ onPress, icon: Icon = Plus, className = '' }: FABProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center ${className}`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      })}
    >
      <Icon size={24} color={colors.white} strokeWidth={2.5} />
    </Pressable>
  );
}
