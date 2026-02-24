import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@ssm/shared';
import { Mail, Lock } from 'lucide-react-native';
import { Text, Button, Input, SafeAreaView } from '@/components/ui';
import { useLogin } from '@/hooks/use-auth';

export default function LoginScreen() {
  const login = useLogin();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data);
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
          {/* Logo / Header */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-4">
              <Text variant="h1" className="text-white">S</Text>
            </View>
            <Text variant="h1" className="text-gray-900">Savia SSM</Text>
            <Text variant="bodySmall" muted className="mt-1">Managementul securității în muncă</Text>
          </View>

          {/* Form */}
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
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Parolă"
                  placeholder="Introduceți parola"
                  icon={Lock}
                  secureTextEntry
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              variant="primary"
              size="lg"
              loading={login.isPending}
              onPress={handleSubmit(onSubmit)}
              className="mt-2"
            >
              Autentificare
            </Button>

            <Link href="/(auth)/forgot-password" asChild>
              <Text variant="bodySmall" className="text-primary text-center mt-2">
                Ai uitat parola?
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
