import { View } from 'react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme';

interface ComplianceBarProps {
  compliant: number;
  nonCompliant: number;
  total: number;
}

export function ComplianceBar({ compliant, nonCompliant, total }: ComplianceBarProps) {
  const compliantPercent = total > 0 ? (compliant / total) * 100 : 0;
  const nonCompliantPercent = total > 0 ? (nonCompliant / total) * 100 : 0;
  const unanswered = total - compliant - nonCompliant;

  return (
    <View className="gap-2">
      <View className="flex-row h-3 rounded-full overflow-hidden bg-gray-100">
        {compliantPercent > 0 && (
          <View
            className="h-full rounded-l-full"
            style={{ width: `${compliantPercent}%`, backgroundColor: colors.success }}
          />
        )}
        {nonCompliantPercent > 0 && (
          <View
            className="h-full"
            style={{ width: `${nonCompliantPercent}%`, backgroundColor: colors.danger }}
          />
        )}
      </View>
      <View className="flex-row justify-between">
        <Text variant="caption" style={{ color: colors.success }}>
          {compliant} conforme
        </Text>
        <Text variant="caption" style={{ color: colors.danger }}>
          {nonCompliant} neconforme
        </Text>
        {unanswered > 0 && (
          <Text variant="caption" muted>{unanswered} necompletate</Text>
        )}
      </View>
    </View>
  );
}
