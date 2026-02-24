import { View } from 'react-native';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { MapPin, Calendar } from 'lucide-react-native';
import type { IssueReportDto } from '@ssm/shared';
import { Card, Text, StatusBadge, SeverityBadge } from '@/components/ui';
import { colors } from '@/theme';

interface IssueCardProps {
  issue: IssueReportDto;
  onPress?: () => void;
}

export function IssueCard({ issue, onPress }: IssueCardProps) {
  const date = format(new Date(issue.createdAt), 'dd MMM yyyy', { locale: ro });

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center justify-between mb-2">
        <StatusBadge status={issue.status} type="issue" />
        <SeverityBadge severity={issue.severity} />
      </View>
      <Text variant="h3" className="text-gray-900 mb-1" numberOfLines={2}>
        {issue.title}
      </Text>
      <Text variant="bodySmall" muted numberOfLines={2} className="mb-2">
        {issue.description}
      </Text>
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Calendar size={13} color={colors.gray[400]} />
          <Text variant="caption" muted>{date}</Text>
        </View>
        {issue.categoryName && (
          <Text variant="caption" muted>{issue.categoryName}</Text>
        )}
      </View>
    </Card>
  );
}
