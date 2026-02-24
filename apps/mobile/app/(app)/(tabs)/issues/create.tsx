import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateIssueSchema, type CreateIssueInput } from '@ssm/shared';
import { useCreateIssue, useIssueCategories } from '@/hooks/use-issues';
import { useUploadFile } from '@/hooks/use-upload';
import { Text, Input, TextArea, Button, Select } from '@/components/ui';
import { SeverityPicker } from '@/components/forms/SeverityPicker';
import { SitePicker } from '@/components/forms/SitePicker';
import { LocationDisplay } from '@/components/forms/LocationDisplay';
import { PhotoCapture } from '@/components/forms/PhotoCapture';
import type { Coords } from '@/services/location.service';
import type { LocalPhoto } from '@/services/camera.service';
import Toast from 'react-native-toast-message';

export default function CreateIssueScreen() {
  const router = useRouter();
  const createIssue = useCreateIssue();
  const uploadFile = useUploadFile();
  const { data: categories = [] } = useIssueCategories();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateIssueInput>({
    resolver: zodResolver(CreateIssueSchema),
    defaultValues: {
      severity: 'MEDIUM',
    },
  });

  const onSubmit = async (data: CreateIssueInput) => {
    setIsSubmitting(true);
    try {
      // Upload photos first
      for (const photo of photos) {
        await uploadFile.mutateAsync({
          uri: photo.uri,
          mimeType: 'image/jpeg',
          fileName: `photo_${Date.now()}.jpg`,
        });
      }

      createIssue.mutate(
        {
          ...data,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        },
        { onSuccess: () => router.back() },
      );
    } catch {
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-au putut încărca fotografiile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.uuid,
    label: c.name,
  }));

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-4 py-4 pb-32">
      <Controller
        control={control}
        name="siteUuid"
        render={({ field: { onChange, value } }) => (
          <SitePicker value={value} onChange={onChange} error={errors.siteUuid?.message} />
        )}
      />

      <View className="h-4" />

      {categoryOptions.length > 0 && (
        <>
          <Controller
            control={control}
            name="categoryUuid"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Categorie"
                placeholder="Selectează categoria..."
                options={categoryOptions}
                value={value ?? undefined}
                onChange={onChange}
              />
            )}
          />
          <View className="h-4" />
        </>
      )}

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Titlu"
            placeholder="Descrieți pe scurt problema..."
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <TextArea
            label="Descriere"
            placeholder="Descrieți în detaliu problema observată..."
            value={value}
            onChangeText={onChange}
            error={errors.description?.message}
            rows={4}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="severity"
        render={({ field: { onChange, value } }) => (
          <SeverityPicker
            label="Severitate"
            value={value}
            onChange={onChange}
          />
        )}
      />

      <View className="h-4" />

      <LocationDisplay coords={coords} onCoordsChange={setCoords} />

      <View className="h-4" />

      <PhotoCapture
        label="Fotografii"
        photos={photos}
        onPhotosChange={setPhotos}
        maxPhotos={5}
      />

      <View className="h-6" />

      <Button
        variant="primary"
        size="lg"
        loading={isSubmitting || createIssue.isPending}
        onPress={handleSubmit(onSubmit)}
      >
        Raportează problema
      </Button>
    </ScrollView>
  );
}
