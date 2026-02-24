import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEmployeeSchema, type CreateEmployeeInput } from '@ssm/shared';
import { useCreateEmployee } from '@/hooks/use-employees';
import { Text, Input, Button, DatePicker } from '@/components/ui';

export default function CreateEmployeeScreen() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  const { control, handleSubmit, formState: { errors } } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(CreateEmployeeSchema),
  });

  const onSubmit = (data: CreateEmployeeInput) => {
    createEmployee.mutate(data, { onSuccess: () => router.back() });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-4 py-4 pb-32">
      <Text variant="h2" className="text-gray-900 mb-4">Angajat nou</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Prenume"
            placeholder="Prenumele angajatului..."
            value={value}
            onChangeText={onChange}
            error={errors.firstName?.message}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Nume"
            placeholder="Numele angajatului..."
            value={value}
            onChangeText={onChange}
            error={errors.lastName?.message}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="cnp"
        render={({ field: { onChange, value } }) => (
          <Input
            label="CNP"
            placeholder="Codul numeric personal..."
            value={value ?? ''}
            onChangeText={onChange}
            keyboardType="numeric"
            error={errors.cnp?.message}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="jobTitle"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Funcția"
            placeholder="Funcția angajatului..."
            value={value ?? ''}
            onChangeText={onChange}
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Telefon"
            placeholder="Numărul de telefon..."
            value={value ?? ''}
            onChangeText={onChange}
            keyboardType="phone-pad"
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email (opțional)"
            placeholder="Adresa de email..."
            value={value ?? ''}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <View className="h-4" />

      <Controller
        control={control}
        name="hireDate"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Data angajării"
            value={value ? new Date(value) : undefined}
            onChange={(date) => onChange(date.toISOString().split('T')[0])}
          />
        )}
      />

      <View className="h-6" />

      <Button
        variant="primary"
        size="lg"
        loading={createEmployee.isPending}
        onPress={handleSubmit(onSubmit)}
      >
        Adaugă angajatul
      </Button>
    </ScrollView>
  );
}
