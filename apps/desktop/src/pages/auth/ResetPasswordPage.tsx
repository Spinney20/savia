import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPassword } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Input } from '@/components/ui';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';

const ResetFormSchema = z.object({
  password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere').max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parolele nu se potrivesc',
  path: ['confirmPassword'],
});

type ResetFormInput = z.infer<typeof ResetFormSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPassword = useResetPassword();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormInput>({
    resolver: zodResolver(ResetFormSchema),
  });

  const onSubmit = (data: ResetFormInput) => {
    resetPassword.mutate({ token, password: data.password });
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link invalid</h2>
          <p className="text-sm text-gray-500">
            Linkul de resetare este invalid sau a expirat.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Parolă resetată</h2>
          <p className="text-sm text-gray-500 mb-4">
            Parola dvs. a fost resetată cu succes.
          </p>
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-800 transition-colors">
            <ArrowLeft size={14} />
            Mergi la autentificare
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Resetare parolă</h2>
      <p className="text-sm text-gray-500 mb-6">
        Introduceți noua parolă pentru contul dvs.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Parolă nouă"
          type="password"
          placeholder="Minimum 8 caractere"
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmă parola"
          type="password"
          placeholder="Repetați parola"
          icon={Lock}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={resetPassword.isPending}
          className="w-full"
        >
          Resetează parola
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
