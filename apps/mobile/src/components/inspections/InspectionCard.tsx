import { View } from 'react-native';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ClipboardCheck, Calendar } from 'lucide-react-native';
import type { InspectionDto } from '@ssm/shared';
import { Card, Text, StatusBadge, ProgressRing } from '@/components/ui';
import { colors } from '@/theme';

interface InspectionCardProps {
  inspection: InspectionDto;
  onPress?: () => void;
}

export function InspectionCard({ inspection, onPress }: InspectionCardProps) {
  const date = format(new Date(inspection.createdAt), 'dd MMM yyyy', { locale: ro });
  const compliancePercent = inspection.totalItems > 0
    ? Math.round((inspection.compliantItems / inspection.totalItems) * 100)
    : 0;

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <StatusBadge status={inspection.status} type="inspection" />
          <Text variant="h3" className="text-gray-900 mt-2" numberOfLines={2}>
            {inspection.templateName}
          </Text>
        </View>
        {inspection.totalItems > 0 && (
          <ProgressRing progress={compliancePercent} size={44} strokeWidth={4} />
        )}
      </View>
      <View className="flex-row items-center gap-3 mt-1">
        <View className="flex-row items-center gap-1">
          <Calendar size={13} color={colors.gray[400]} />
          <Text variant="caption" muted>{date}</Text>
        </View>
        <Text variant="caption" muted>{inspection.inspectorName}</Text>
        <Text variant="caption" muted>
          {inspection.compliantItems}/{inspection.totalItems} conforme
        </Text>
      </View>
    </Card>
  );
}
