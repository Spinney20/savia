import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Users, Calendar, MapPin, FileText } from 'lucide-react-native';
import { useTraining, useTrainingPdf } from '@/hooks/use-trainings';
import { Text, Card, Badge, Button, Spinner, ErrorState } from '@/components/ui';
import { colors } from '@/theme';
import * as WebBrowser from 'expo-web-browser';

export default function TrainingDetailScreen() {
  const { uuid: rawUuid } = useLocalSearchParams<{ uuid: string }>();
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : rawUuid) ?? '';
  const router = useRouter();
  const { data: training, isLoading, isError, refetch } = useTraining(uuid);
  const { data: pdfData } = useTrainingPdf(uuid);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Spinner message="Se încarcă..." />
      </View>
    );
  }

  if (isError || !training) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState
          title="Eroare"
          description="Nu am putut încărca detaliile instructajului."
          onRetry={refetch}
        />
      </View>
    );
  }

  const openPdf = async () => {
    if (pdfData?.pdfUrl) {
      await WebBrowser.openBrowserAsync(pdfData.pdfUrl);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-32">
      <Card className="mx-4 mt-4">
        <Badge label={training.trainingType} className="mb-2" />
        <Text variant="h2" className="text-gray-900 mb-3">{training.title}</Text>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Calendar size={15} color={colors.gray[400]} />
            <Text variant="bodySmall" muted>
              {format(new Date(training.conductedAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Users size={15} color={colors.gray[400]} />
            <Text variant="bodySmall" muted>
              {training.participantCount} participanți
            </Text>
          </View>
          <Text variant="bodySmall" muted>Condus de: {training.conductorName}</Text>
        </View>
      </Card>

      {training.participants && training.participants.length > 0 && (
        <View className="mx-4 mt-4">
          <Text variant="h3" className="text-gray-900 mb-3">
            Participanți ({training.participants.length})
          </Text>
          {training.participants.map((p: { employeeName: string; employeeUuid?: string; confirmed?: boolean }) => (
            <Card key={p.employeeUuid ?? p.employeeName} className="mb-2">
              <View className="flex-row items-center justify-between">
                <Text variant="bodySmall" className="text-gray-900">
                  {p.employeeName}
                </Text>
                <Badge
                  label={p.confirmed ? 'Confirmat' : 'Neconfirmat'}
                  bgColor={p.confirmed ? 'bg-success-50' : 'bg-gray-100'}
                  color={p.confirmed ? 'text-success' : 'text-gray-500'}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      <View className="px-4 mt-6 gap-3">
        {pdfData?.pdfUrl && (
          <Button variant="outline" size="lg" icon={FileText} onPress={openPdf}>
            Vizualizează PDF
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          onPress={() => router.push(`/(app)/(tabs)/trainings/confirm?uuid=${uuid}`)}
        >
          Confirmă participarea
        </Button>
      </View>
    </ScrollView>
  );
}
