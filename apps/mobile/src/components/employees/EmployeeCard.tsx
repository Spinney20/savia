import { View } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import type { EmployeeDto } from '@ssm/shared';
import { Card, Text, Avatar, StatusBadge } from '@/components/ui';
import { colors } from '@/theme';

interface EmployeeCardProps {
  employee: EmployeeDto;
  onPress?: () => void;
}

export function EmployeeCard({ employee, onPress }: EmployeeCardProps) {
  const fullName = employee.firstName + ' ' + employee.lastName;

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-3">
        <Avatar name={fullName} size={44} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text variant="h3" className="text-gray-900 flex-1" numberOfLines={1}>
              {fullName}
            </Text>
            <StatusBadge status={employee.status} type="employee" />
          </View>
          {employee.jobTitle && (
            <View className="flex-row items-center gap-1.5">
              <Briefcase size={13} color={colors.gray[400]} />
              <Text variant="bodySmall" muted numberOfLines={1}>{employee.jobTitle}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}