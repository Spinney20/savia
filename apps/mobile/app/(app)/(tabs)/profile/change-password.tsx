import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordSchema, type ChangePasswordInput } from '@ssm/shared';
import { useChangePassword } from '@/hooks/use-auth';
import { Text, Input, Button } from '@/components/ui';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();

  const { control, handleSubmit, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword.mutate(data, { onSuccess: () => router.back() });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-4 py-4 pb-32">
      <Text variant="h2" className="text-gray-900 mb-2">Schimbă parola</Text>
      <Text variant="bodySmall" muted className="mb-6">
        Introduceți parola curentă și noua parolă.
      </Text>

      <Controller
        control={control}
        name="currentPassword"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Parola curentă"
            placeholder="Parola curentă..."
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={errors.currentPassword?.message}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Parola nouă"
            placeholder="Parola nouă..."
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={errors.newPassword?.message}
          />
        )}
      />

      <View className="h-6" />

      <Button
        variant="primary"
        size="lg"
        loading={changePassword.isPending}
        onPress={handleSubmit(onSubmit)}
      >
        Schimbă parola
      </Button>
    </ScrollView>
  );
}
