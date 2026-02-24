import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordSchema, type ChangePasswordInput } from '@ssm/shared';
import { useChangePassword } from '@/hooks/use-auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();

  const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword.mutate(data);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Înapoi
      </button>

      <PageHeader title="Schimbă parola" subtitle="Introduceți parola curentă și noua parolă." className="mb-6" />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Parola curentă"
            type="password"
            placeholder="Parola curentă..."
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="Parola nouă"
            type="password"
            placeholder="Parola nouă..."
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={changePassword.isPending}
            className="w-full"
          >
            Schimbă parola
          </Button>
        </form>
      </Card>
    </div>
  );
}
