import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEmployeeSchema, type CreateEmployeeInput } from '@ssm/shared';
import { useCreateEmployee } from '@/hooks/use-employees';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input } from '@/components/ui';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployee();

  const { control, handleSubmit, formState: { errors } } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(CreateEmployeeSchema),
  });

  const onSubmit = (data: CreateEmployeeInput) => {
    createEmployee.mutate(data, { onSuccess: () => navigate('/employees') });
  };

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Angajat nou" className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Input
                  label="Prenume"
                  placeholder="Prenume..."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.firstName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Input
                  label="Nume"
                  placeholder="Nume..."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.lastName?.message}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="cnp"
            render={({ field }) => (
              <Input
                label="CNP (opțional)"
                placeholder="1234567890123"
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.cnp?.message}
                maxLength={13}
              />
            )}
          />

          <Controller
            control={control}
            name="jobTitle"
            render={({ field }) => (
              <Input
                label="Funcție (opțional)"
                placeholder="Ex: Muncitor, Inginer..."
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label="Email (opțional)"
                  type="email"
                  placeholder="email@exemplu.ro"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  label="Telefon (opțional)"
                  placeholder="07xxxxxxxx"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="hireDate"
            render={({ field }) => (
              <Input
                label="Data angajării (opțional)"
                type="date"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate('/employees')}>
              Anulează
            </Button>
            <Button type="submit" loading={createEmployee.isPending}>
              Adaugă angajat
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
