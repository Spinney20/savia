import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import type { CreateInspectionInput, InspectionItemInput } from '@ssm/shared';
import { useTemplates, useTemplate } from '@/hooks/use-templates';
import { useCreateInspection } from '@/hooks/use-inspections';
import { DynamicInspectionForm } from '@/components/forms/DynamicInspectionForm';
import { SitePicker } from '@/components/forms/SitePicker';
import { Text, Button, Card, Select, Spinner } from '@/components/ui';

type Step = 'setup' | 'form' | 'review';

export default function CreateInspectionScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('setup');
  const [siteUuid, setSiteUuid] = useState('');
  const [templateUuid, setTemplateUuid] = useState('');
  const [items, setItems] = useState<InspectionItemInput[]>([]);
  const createInspection = useCreateInspection();

  const { data: templatesData } = useTemplates({ limit: 50 });
  const templates = templatesData?.data ?? [];
  const { data: templateDetail, isLoading: loadingTemplate } = useTemplate(templateUuid);

  const templateOptions = templates.map((t) => ({
    value: t.uuid,
    label: t.name,
  }));

  const handleNext = () => {
    if (step === 'setup' && siteUuid && templateUuid) {
      setStep('form');
    }
  };

  const handleSubmit = (formItems: InspectionItemInput[]) => {
    setItems(formItems);
    createInspection.mutate(
      {
        siteUuid,
        templateUuid,
        templateVersionNumber: templateDetail?.currentVersionNumber ?? 1,
        items: formItems,
      } as CreateInspectionInput,
      { onSuccess: () => router.back() },
    );
  };

  const handleSaveDraft = (formItems: InspectionItemInput[]) => {
    setItems(formItems);
    createInspection.mutate(
      {
        siteUuid,
        templateUuid,
        templateVersionNumber: templateDetail?.currentVersionNumber ?? 1,
        items: formItems,
        isDraft: true,
      } as CreateInspectionInput,
      { onSuccess: () => router.back() },
    );
  };

  if (step === 'setup') {
    return (
      <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-4 py-4 pb-32">
        <Text variant="h2" className="text-gray-900 mb-4">Configurare inspecție</Text>

        <SitePicker value={siteUuid} onChange={setSiteUuid} />

        <View className="h-4" />

        <Select
          label="Șablon inspecție"
          placeholder="Selectează șablonul..."
          options={templateOptions}
          value={templateUuid || undefined}
          onChange={setTemplateUuid}
        />

        {templateDetail && (
          <Card className="mt-4">
            <Text variant="bodySmall" className="text-gray-900 font-medium">{templateDetail.name}</Text>
            {templateDetail.description && (
              <Text variant="caption" muted className="mt-1">{templateDetail.description}</Text>
            )}
            {templateDetail.currentStructure && (
              <Text variant="caption" muted className="mt-1">
                {templateDetail.currentStructure.sections.length} secțiuni,{' '}
                {templateDetail.currentStructure.sections.reduce((sum, s) => sum + s.questions.length, 0)} întrebări
              </Text>
            )}
          </Card>
        )}

        <View className="h-6" />

        <Button
          variant="primary"
          size="lg"
          onPress={handleNext}
          disabled={!siteUuid || !templateUuid}
        >
          Continuă
        </Button>
      </ScrollView>
    );
  }

  if (step === 'form') {
    if (loadingTemplate || !templateDetail?.currentStructure) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50">
          <Spinner message="Se încarcă șablonul..." />
        </View>
      );
    }

    return (
      <DynamicInspectionForm
        structure={templateDetail.currentStructure}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        submitting={createInspection.isPending}
      />
    );
  }

  return null;
}
