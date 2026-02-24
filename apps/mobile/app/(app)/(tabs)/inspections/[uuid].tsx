import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { FileText, User, Calendar } from 'lucide-react-native';
import { useInspection, useInspectionReviews, useSubmitInspection, useCloseInspection } from '@/hooks/use-inspections';
import { Text, Card, StatusBadge, Button, Spinner, ErrorState } from '@/components/ui';
import { ComplianceBar } from '@/components/inspections/ComplianceBar';
import { colors } from '@/theme';

export default function InspectionDetailScreen() {
  const { uuid: rawUuid } = useLocalSearchParams<{ uuid: string }>();
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : rawUuid) ?? '';
  const router = useRouter();
  const { data: inspection, isLoading, isError, refetch } = useInspection(uuid);
  const { data: reviews = [] } = useInspectionReviews(uuid);
  const submitInspection = useSubmitInspection();
  const closeInspection = useCloseInspection();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Spinner message="Se încarcă..." />
      </View>
    );
  }

  if (isError || !inspection) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState
          title="Eroare"
          description="Nu am putut încărca detaliile inspecției."
          onRetry={refetch}
        />
      </View>
    );
  }

  const canSubmit = inspection.status === 'DRAFT';
  const canClose = inspection.status === 'APPROVED';

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-32">
      <Card className="mx-4 mt-4">
        <View className="flex-row items-center justify-between mb-3">
          <StatusBadge status={inspection.status} type="inspection" />
          {inspection.riskScore !== null && (
            <Text variant="bodySmall" className="font-semibold" style={{ color: colors.primary.DEFAULT }}>
              Risc: {inspection.riskScore}
            </Text>
          )}
        </View>
        <Text variant="h2" className="text-gray-900 mb-2">{inspection.templateName}</Text>

        <View className="gap-2 mb-4">
          <View className="flex-row items-center gap-2">
            <User size={15} color={colors.gray[400]} />
            <Text variant="bodySmall" muted>Inspector: {inspection.inspectorName}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Calendar size={15} color={colors.gray[400]} />
            <Text variant="bodySmall" muted>
              {format(new Date(inspection.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
            </Text>
          </View>
        </View>

        <ComplianceBar
          compliant={inspection.compliantItems}
          nonCompliant={inspection.nonCompliantItems}
          total={inspection.totalItems}
        />
      </Card>

      {/* Items summary */}
      {inspection.items && inspection.items.length > 0 && (
        <View className="mx-4 mt-4">
          <Text variant="h3" className="text-gray-900 mb-3">Rezultate ({inspection.items.length})</Text>
          {inspection.items.filter((item) => item.isCompliant === false).map((item) => (
            <Card key={`${item.sectionId}-${item.questionId}`} className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text variant="bodySmall" className="text-danger font-medium">Neconform</Text>
                {item.severity && (
                  <Text variant="caption" className="text-danger">{item.severity}</Text>
                )}
              </View>
              {item.notes && <Text variant="bodySmall" muted>{item.notes}</Text>}
            </Card>
          ))}
        </View>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <View className="mx-4 mt-4">
          <Text variant="h3" className="text-gray-900 mb-3">Recenzii ({reviews.length})</Text>
          {reviews.map((review) => (
            <Card key={`${review.reviewerName}-${review.reviewedAt}`} className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text variant="bodySmall" className="font-semibold text-gray-900">
                  {review.reviewerName}
                </Text>
                <Text variant="caption" className={
                  review.decision === 'APPROVED' ? 'text-success' :
                  review.decision === 'REJECTED' ? 'text-danger' : 'text-warning'
                }>
                  {review.decision === 'APPROVED' ? 'Aprobat' :
                   review.decision === 'REJECTED' ? 'Respins' : 'Necesită revizuire'}
                </Text>
              </View>
              {review.reason && <Text variant="bodySmall" muted>{review.reason}</Text>}
              <Text variant="caption" muted className="mt-1">
                {format(new Date(review.reviewedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="px-4 mt-6 gap-3">
        {canSubmit && (
          <Button
            variant="primary"
            size="lg"
            loading={submitInspection.isPending}
            onPress={() => submitInspection.mutate(uuid, { onSuccess: () => refetch() })}
          >
            Trimite pentru aprobare
          </Button>
        )}
        {canClose && (
          <Button
            variant="secondary"
            size="lg"
            loading={closeInspection.isPending}
            onPress={() => closeInspection.mutate(uuid, { onSuccess: () => refetch() })}
          >
            Închide inspecția
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
