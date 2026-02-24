import { View, Switch as RNSwitch, type SwitchProps as RNSwitchProps } from 'react-native';
import { Text } from './Text';
import { colors } from '@/theme';

interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor'> {
  label?: string;
  description?: string;
}

export function Switch({ label, description, ...props }: SwitchProps) {
  return (
    <View className="flex-row items-center justify-between py-2">
      {label && (
        <View className="flex-1 mr-4">
          <Text variant="body" className="text-gray-900">{label}</Text>
          {description && (
            <Text variant="caption" muted>{description}</Text>
          )}
        </View>
      )}
      <RNSwitch
        trackColor={{ false: colors.gray[200], true: colors.primary[400] }}
        thumbColor={props.value ? colors.primary.DEFAULT : colors.gray[50]}
        ios_backgroundColor={colors.gray[200]}
        {...props}
      />
    </View>
  );
}
