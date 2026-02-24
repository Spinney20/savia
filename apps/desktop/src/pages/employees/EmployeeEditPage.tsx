import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateEmployeeSchema, type UpdateEmployeeInput, EMPLOYEE_STATUSES, EMPLOYEE_STATUS_LABELS_RO } from '@ssm/shared';
import { useEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Select, Spinner, ErrorState } from '@/components/ui';
import { useEffect } from 'react';

const STATUS_OPTIONS = EMPLOYEE_STATUSES.map((s) => ({
  value: s,
  label: EMPLOYEE_STATUS_LABELS_RO[s],
}));

export default function EmployeeEditPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading, isError, refetch } = useEmployee(uuid!);
  const updateEmployee = useUpdateEmployee(uuid!);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(UpdateEmployeeSchema),
  });

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        email: employee.email,
        jobTitle: employee.jobTitle,
        hireDate: employee.hireDate,
        status: employee.status,
        terminationDate: employee.terminationDate,
      });
    }
  }, [employee, reset]);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !employee) return <ErrorState onRetry={refetch} className="mt-16" />;

  const onSubmit = (data: UpdateEmployeeInput) => {
    updateEmployee.mutate(data, { onSuccess: () => navigate(`/employees/${uuid}`) });
  };

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title={`Editează: ${employee.firstName} ${employee.lastName}`} className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Input
                  label="Prenume"
                  value={field.value ?? ''}
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
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.lastName?.message}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="jobTitle"
            render={({ field }) => (
              <Input
                label="Funcție"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label="Status"
                options={STATUS_OPTIONS}
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
                  label="Email"
                  type="email"
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
                  label="Telefon"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="hireDate"
              render={({ field }) => (
                <Input
                  label="Data angajării"
                  type="date"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="terminationDate"
              render={({ field }) => (
                <Input
                  label="Data încetării (opțional)"
                  type="date"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(`/employees/${uuid}`)}>
              Anulează
            </Button>
            <Button type="submit" loading={updateEmployee.isPending}>
              Salvează modificările
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
