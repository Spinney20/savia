import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@ssm/shared';
import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Input } from '@/components/ui';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    });
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Autentificare</h2>
      <p className="text-sm text-gray-500 mb-6">Introduceți datele de acces pentru a continua.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@companie.ro"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Parolă"
          type="password"
          placeholder="Parola dvs."
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={login.isPending}
          className="w-full mt-2"
        >
          Autentificare
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-800 transition-colors">
          Ați uitat parola?
        </Link>
      </div>
    </AuthLayout>
  );
}
