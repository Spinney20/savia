import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateIssueSchema, type CreateIssueInput } from '@ssm/shared';
import { useCreateIssue, useIssueCategories } from '@/hooks/use-issues';
import { SitePicker } from '@/components/forms/SitePicker';
import { SeverityPicker } from '@/components/forms/SeverityPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, TextArea, Select } from '@/components/ui';

export default function IssueCreatePage() {
  const navigate = useNavigate();
  const createIssue = useCreateIssue();
  const { data: categories = [] } = useIssueCategories();

  const categoryOptions = categories.map((c) => ({ value: c.uuid, label: c.name }));

  const { control, handleSubmit, formState: { errors } } = useForm<CreateIssueInput>({
    resolver: zodResolver(CreateIssueSchema),
    defaultValues: {
      severity: 'MEDIUM',
    },
  });

  const onSubmit = (data: CreateIssueInput) => {
    createIssue.mutate(data, { onSuccess: () => navigate('/issues') });
  };

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Raportează problemă" className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="space-y-5">
          <Controller
            control={control}
            name="siteUuid"
            render={({ field }) => (
              <SitePicker value={field.value} onChange={field.onChange} error={errors.siteUuid?.message} />
            )}
          />

          {categoryOptions.length > 0 && (
            <Controller
              control={control}
              name="categoryUuid"
              render={({ field }) => (
                <Select
                  label="Categorie"
                  placeholder="Selectează categoria..."
                  options={categoryOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input
                label="Titlu"
                placeholder="Descrieți pe scurt problema..."
                value={field.value}
                onChange={field.onChange}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextArea
                label="Descriere"
                placeholder="Descrieți în detaliu problema observată..."
                value={field.value}
                onChange={field.onChange}
                error={errors.description?.message}
                rows={4}
              />
            )}
          />

          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <SeverityPicker
                value={field.value}
                onChange={field.onChange}
                error={errors.severity?.message}
              />
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate('/issues')}>
              Anulează
            </Button>
            <Button type="submit" loading={createIssue.isPending}>
              Raportează problema
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
