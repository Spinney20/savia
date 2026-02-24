import { View, TextInput, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { colors } from '@/theme';

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  rows?: number;
}

export function TextArea({ label, error, rows = 4, className = '', ...props }: TextAreaProps) {
  const borderColor = error ? 'border-danger' : 'border-gray-200 focus:border-primary';

  return (
    <View className="gap-1.5">
      {label && (
        <Text variant="bodySmall" className="text-gray-700 font-medium">{label}</Text>
      )}
      <TextInput
        className={`bg-white border rounded-xl px-4 py-3.5 text-base text-gray-900 ${borderColor} ${className}`}
        placeholderTextColor={colors.gray[400]}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        style={{ minHeight: rows * 24 + 28 }}
        {...props}
      />
      {error && (
        <Text variant="caption" className="text-danger ml-1">{error}</Text>
      )}
    </View>
  );
}
