import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Briefcase, Phone, Mail, MapPin, Calendar } from 'lucide-react-native';
import { useEmployee } from '@/hooks/use-employees';
import { Text, Card, Avatar, StatusBadge, Spinner, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

export default function EmployeeDetailScreen() {
  const { uuid: rawUuid } = useLocalSearchParams<{ uuid: string }>();
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : rawUuid) ?? '';
  const { data: employee, isLoading, isError, refetch } = useEmployee(uuid);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Spinner message="Se încarcă..." />
      </View>
    );
  }

  if (isError || !employee) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState
          title="Eroare"
          description="Nu am putut încărca datele angajatului."
          onRetry={refetch}
        />
      </View>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-32">
      <Card className="mx-4 mt-4">
        <View className="items-center mb-4">
          <Avatar name={fullName} size={64} />
          <Text variant="h2" className="text-gray-900 mt-3">{fullName}</Text>
          <StatusBadge status={employee.status} type="employee" />
        </View>

        <View className="gap-3">
          {employee.jobTitle && (
            <View className="flex-row items-center gap-3">
              <Briefcase size={16} color={colors.gray[400]} />
              <Text variant="body" className="text-gray-700">{employee.jobTitle}</Text>
            </View>
          )}
          {employee.phone && (
            <View className="flex-row items-center gap-3">
              <Phone size={16} color={colors.gray[400]} />
              <Text variant="body" className="text-gray-700">{employee.phone}</Text>
            </View>
          )}
          {employee.email && (
            <View className="flex-row items-center gap-3">
              <Mail size={16} color={colors.gray[400]} />
              <Text variant="body" className="text-gray-700">{employee.email}</Text>
            </View>
          )}
          {employee.hireDate && (
            <View className="flex-row items-center gap-3">
              <Calendar size={16} color={colors.gray[400]} />
              <Text variant="body" className="text-gray-700">
                Angajat din {format(new Date(employee.hireDate), 'dd MMMM yyyy', { locale: ro })}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
