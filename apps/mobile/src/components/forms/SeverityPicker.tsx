import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme';

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Scăzut', color: colors.severity.LOW },
  { value: 'MEDIUM', label: 'Mediu', color: colors.severity.MEDIUM },
  { value: 'HIGH', label: 'Ridicat', color: colors.severity.HIGH },
  { value: 'CRITICAL', label: 'Critic', color: colors.severity.CRITICAL },
] as const;

interface SeverityPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function SeverityPicker({ value, onChange, label, error }: SeverityPickerProps) {
  return (
    <View className="gap-1.5">
      {label && <Text variant="bodySmall" className="text-gray-700 font-medium">{label}</Text>}
      <View className="flex-row gap-2">
        {SEVERITY_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`flex-1 py-2.5 rounded-xl items-center border-2 ${
                isSelected ? 'border-current' : 'border-transparent bg-gray-100'
              }`}
              style={isSelected ? { backgroundColor: opt.color + '15', borderColor: opt.color } : undefined}
            >
              <View
                className="w-3 h-3 rounded-full mb-1"
                style={{ backgroundColor: opt.color }}
              />
              <Text variant="caption" className={isSelected ? 'font-semibold' : ''} style={isSelected ? { color: opt.color } : undefined}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && <Text variant="caption" className="text-danger ml-1">{error}</Text>}
    </View>
  );
}
