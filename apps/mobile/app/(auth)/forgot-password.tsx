import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@ssm/shared';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { Text, Button, Input, SafeAreaView } from '@/components/ui';
import { useForgotPassword } from '@/hooks/use-auth';
import { Pressable } from 'react-native';
import { colors } from '@/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const forgotPassword = useForgotPassword();

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword.mutate(data, {
      onSuccess: () => {
        setTimeout(() => router.back(), 2000);
      },
    });
  };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <Pressable onPress={() => router.back()} className="mt-4 mb-8">
            <ArrowLeft size={24} color={colors.gray[700]} />
          </Pressable>

          <Text variant="h2" className="mb-2">Resetare parolă</Text>
          <Text variant="body" muted className="mb-8">
            Introduceți adresa de email asociată contului dvs. și vă vom trimite un link de resetare.
          </Text>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="exemplu@firma.ro"
                  icon={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Button
              variant="primary"
              size="lg"
              loading={forgotPassword.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              Trimite link de resetare
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
