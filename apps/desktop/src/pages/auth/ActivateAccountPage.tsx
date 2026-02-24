import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActivateAccount } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button, Input } from '@/components/ui';
import { Lock, CheckCircle } from 'lucide-react';

const ActivateFormSchema = z.object({
  password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere').max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parolele nu se potrivesc',
  path: ['confirmPassword'],
});

type ActivateFormInput = z.infer<typeof ActivateFormSchema>;

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const activate = useActivateAccount();

  const { register, handleSubmit, formState: { errors } } = useForm<ActivateFormInput>({
    resolver: zodResolver(ActivateFormSchema),
  });

  const onSubmit = (data: ActivateFormInput) => {
    activate.mutate(
      { token, password: data.password },
      { onSuccess: () => navigate('/dashboard') },
    );
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link invalid</h2>
          <p className="text-sm text-gray-500">
            Linkul de activare este invalid sau a expirat.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (activate.isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cont activat</h2>
          <p className="text-sm text-gray-500">
            Contul dvs. a fost activat cu succes. Veți fi redirecționat...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Activare cont</h2>
      <p className="text-sm text-gray-500 mb-6">
        Setați o parolă pentru a vă activa contul.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Parolă"
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
          loading={activate.isPending}
          className="w-full"
        >
          Activează contul
        </Button>
      </form>
    </AuthLayout>
  );
}
