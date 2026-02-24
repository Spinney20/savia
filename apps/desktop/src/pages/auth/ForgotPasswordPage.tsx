import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@ssm/shared';
import { useForgotPassword } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Input } from '@/components/ui';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword.mutate(data);
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Recuperare parolă</h2>
      <p className="text-sm text-gray-500 mb-6">
        Introduceți adresa de email și veți primi un link de resetare.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@companie.ro"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={forgotPassword.isPending}
          className="w-full"
        >
          Trimite link de resetare
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-800 transition-colors">
          <ArrowLeft size={14} />
          Înapoi la autentificare
        </Link>
      </div>
    </AuthLayout>
  );
}
