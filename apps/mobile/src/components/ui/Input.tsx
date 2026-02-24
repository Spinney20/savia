import { View, TextInput, type TextInputProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from './Text';
import { colors } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export function Input({ label, error, icon: Icon, className = '', ...props }: InputProps) {
  const borderColor = error ? 'border-danger' : 'border-gray-200 focus:border-primary';

  return (
    <View className="gap-1.5">
      {label && (
        <Text variant="bodySmall" className="text-gray-700 font-medium">{label}</Text>
      )}
      <View className={`flex-row items-center bg-white border rounded-xl px-4 ${borderColor}`}>
        {Icon && (
          <Icon size={20} color={colors.gray[400]} style={{ marginRight: 12 }} />
        )}
        <TextInput
          className={`flex-1 py-3.5 text-base text-gray-900 ${className}`}
          placeholderTextColor={colors.gray[400]}
          {...props}
        />
      </View>
      {error && (
        <Text variant="caption" className="text-danger ml-1">{error}</Text>
      )}
    </View>
  );
}
