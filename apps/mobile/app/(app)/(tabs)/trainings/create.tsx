import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTrainingSchema, type CreateTrainingInput, TRAINING_TYPES } from '@ssm/shared';
import { useCreateTraining } from '@/hooks/use-trainings';
import { Text, Input, TextArea, Button, Select, DatePicker } from '@/components/ui';
import { SitePicker } from '@/components/forms/SitePicker';

const trainingTypeOptions = TRAINING_TYPES.map((t) => ({
  value: t,
  label: t.replace(/_/g, ' '),
}));

export default function CreateTrainingScreen() {
  const router = useRouter();
  const createTraining = useCreateTraining();

  const { control, handleSubmit, formState: { errors } } = useForm<CreateTrainingInput>({
    resolver: zodResolver(CreateTrainingSchema),
    defaultValues: {
      trainingType: 'PERIODIC',
    },
  });

  const onSubmit = (data: CreateTrainingInput) => {
    createTraining.mutate(data, { onSuccess: () => router.back() });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-4 py-4 pb-32">
      <Text variant="h2" className="text-gray-900 mb-4">Instructaj nou</Text>

      <Controller
        control={control}
        name="siteUuid"
        render={({ field: { onChange, value } }) => (
          <SitePicker value={value} onChange={onChange} error={errors.siteUuid?.message} />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Titlu"
            placeholder="Denumirea instructajului..."
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="trainingType"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Tipul instructajului"
            placeholder="Selectează tipul..."
            options={trainingTypeOptions}
            value={value}
            onChange={onChange}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="conductedAt"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Data desfășurării"
            value={value ? new Date(value) : undefined}
            onChange={(date) => onChange(date.toISOString())}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <TextArea
            label="Descriere (opțional)"
            placeholder="Detalii despre instructaj..."
            value={value ?? ''}
            onChangeText={onChange}
            rows={3}
          />
        )}
      />

      <View className="h-6" />

      <Button
        variant="primary"
        size="lg"
        loading={createTraining.isPending}
        onPress={handleSubmit(onSubmit)}
      >
        Creează instructajul
      </Button>
    </ScrollView>
  );
}
