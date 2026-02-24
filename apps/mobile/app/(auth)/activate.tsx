import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { Text, Button, Input, SafeAreaView } from '@/components/ui';
import { useActivate } from '@/hooks/use-auth';
import { colors } from '@/theme';

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function ActivateScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const activate = useActivate();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (data: FormData) => {
    if (!token) return;
    activate.mutate({ token, password: data.password });
  };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="items-center mb-8">
            <View className="bg-primary-50 rounded-full p-4 mb-4">
              <ShieldCheck size={48} color={colors.primary.DEFAULT} />
            </View>
            <Text variant="h2" className="text-center">Activare cont</Text>
            <Text variant="bodySmall" muted className="text-center mt-2">
              Setați parola pentru a vă activa contul
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="password"
              rules={{ required: 'Parola este obligatorie', minLength: { value: 8, message: 'Minim 8 caractere' } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Parolă nouă"
                  placeholder="Minim 8 caractere"
                  icon={Lock}
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Confirmarea este obligatorie',
                validate: (val) => val === watch('password') || 'Parolele nu coincid',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmă parola"
                  placeholder="Repetați parola"
                  icon={Lock}
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              variant="primary"
              size="lg"
              loading={activate.isPending}
              onPress={handleSubmit(onSubmit)}
              className="mt-2"
            >
              Activează contul
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
