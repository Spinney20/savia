import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTrainingSchema, type CreateTrainingInput, TRAINING_TYPES } from '@ssm/shared';
import { useCreateTraining } from '@/hooks/use-trainings';
import { useEmployees } from '@/hooks/use-employees';
import { SitePicker } from '@/components/forms/SitePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, TextArea, Select } from '@/components/ui';

const TRAINING_TYPE_OPTIONS = TRAINING_TYPES.map((t) => ({
  value: t,
  label: t.replace(/_/g, ' '),
}));

export default function TrainingCreatePage() {
  const navigate = useNavigate();
  const createTraining = useCreateTraining();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<CreateTrainingInput>({
    resolver: zodResolver(CreateTrainingSchema),
    defaultValues: {
      trainingType: 'PERIODIC',
      participantEmployeeUuids: [],
    },
  });

  const siteUuid = watch('siteUuid');
  const { data: employeesData } = useEmployees({ limit: 100, ...(siteUuid ? { siteUuid } : {}) });
  const employees = employeesData?.data ?? [];

  const toggleEmployee = (uuid: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );
  };

  const onSubmit = (data: CreateTrainingInput) => {
    createTraining.mutate(
      { ...data, participantEmployeeUuids: selectedEmployees },
      { onSuccess: () => navigate('/trainings') },
    );
  };

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader title="Instructaj nou" className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="space-y-5">
          <Controller
            control={control}
            name="siteUuid"
            render={({ field }) => (
              <SitePicker value={field.value} onChange={field.onChange} error={errors.siteUuid?.message} />
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input
                label="Titlu"
                placeholder="Denumirea instructajului..."
                value={field.value}
                onChange={field.onChange}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="trainingType"
            render={({ field }) => (
              <Select
                label="Tipul instructajului"
                options={TRAINING_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="conductedAt"
            render={({ field }) => (
              <Input
                label="Data desfășurării"
                type="datetime-local"
                value={field.value ? field.value.slice(0, 16) : ''}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                error={errors.conductedAt?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="durationMinutes"
            render={({ field }) => (
              <Input
                label="Durata (minute)"
                type="number"
                placeholder="60"
                value={field.value?.toString() ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextArea
                label="Descriere (opțional)"
                placeholder="Detalii despre instructaj..."
                value={field.value ?? ''}
                onChange={field.onChange}
                rows={3}
              />
            )}
          />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Participanți ({selectedEmployees.length})
          </h3>
          {employees.length === 0 ? (
            <p className="text-sm text-gray-500">
              {siteUuid ? 'Niciun angajat pe acest șantier.' : 'Selectați mai întâi un șantier.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {employees.map((emp) => (
                <label
                  key={emp.uuid}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.uuid)}
                    onChange={() => toggleEmployee(emp.uuid)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">
                    {emp.firstName} {emp.lastName}
                  </span>
                </label>
              ))}
            </div>
          )}
          {errors.participantEmployeeUuids && (
            <p className="mt-1 text-xs text-danger">Selectați cel puțin un participant.</p>
          )}
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/trainings')}>
            Anulează
          </Button>
          <Button type="submit" loading={createTraining.isPending}>
            Creează instructajul
          </Button>
        </div>
      </form>
    </div>
  );
}
