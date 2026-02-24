import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useTraining, useConfirmTraining } from '@/hooks/use-trainings';
import { useAuthStore } from '@/stores/auth.store';
import { Text, Card, Button, Spinner, ErrorState } from '@/components/ui';
import { colors } from '@/theme';

export default function ConfirmTrainingScreen() {
  const { uuid: rawUuid } = useLocalSearchParams<{ uuid: string }>();
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : rawUuid) ?? '';
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: training, isLoading, isError, refetch } = useTraining(uuid);
  const confirmTraining = useConfirmTraining(uuid);

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
          description="Nu am putut încărca instructajul."
          onRetry={refetch}
        />
      </View>
    );
  }

  const handleConfirm = () => {
    confirmTraining.mutate(
      { confirmationMethod: 'SELF_CONFIRMED' },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-4 py-6">
      <View className="items-center mb-6">
        <CheckCircle size={48} color={colors.primary.DEFAULT} />
        <Text variant="h2" className="text-gray-900 mt-3 text-center">
          Confirmă participarea
        </Text>
      </View>

      <Card className="mb-6">
        <Text variant="h3" className="text-gray-900 mb-2">{training.title}</Text>
        <Text variant="bodySmall" muted>Tip: {training.trainingType}</Text>
        <Text variant="bodySmall" muted>Condus de: {training.conductorName}</Text>
      </Card>

      <Text variant="body" className="text-gray-700 text-center mb-6">
        Confirm că am participat la instructajul de mai sus și am înțeles
        informațiile prezentate.
      </Text>

      <Button
        variant="primary"
        size="lg"
        loading={confirmTraining.isPending}
        onPress={handleConfirm}
      >
        Confirm participarea
      </Button>

      <Button
        variant="outline"
        size="md"
        className="mt-3"
        onPress={() => router.back()}
      >
        Anulează
      </Button>
    </ScrollView>
  );
}
