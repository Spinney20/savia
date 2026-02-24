import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReviewInspectionSchema, type ReviewInspectionInput, type ReviewDecision } from '@ssm/shared';
import { useInspection, useCreateReview } from '@/hooks/use-inspections';
import { InspectionItemsView } from '@/components/inspections/InspectionItemsView';
import { ComplianceBar } from '@/components/inspections/ComplianceBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, TextArea, Spinner, ErrorState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const DECISIONS: { value: ReviewDecision; label: string; icon: typeof CheckCircle2; color: string; bg: string }[] = [
  { value: 'APPROVED', label: 'Aprobă', icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-50 border-success-300' },
  { value: 'REJECTED', label: 'Respinge', icon: XCircle, color: 'text-danger-600', bg: 'bg-danger-50 border-danger-300' },
  { value: 'NEEDS_REVISION', label: 'Necesită revizuire', icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-50 border-warning-300' },
];

export default function InspectionReviewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: inspection, isLoading, isError, refetch } = useInspection(uuid!);
  const createReview = useCreateReview(uuid!);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ReviewInspectionInput>({
    resolver: zodResolver(ReviewInspectionSchema),
  });

  const decision = watch('decision');

  const onSubmit = (data: ReviewInspectionInput) => {
    createReview.mutate(data, { onSuccess: () => navigate(`/inspections/${uuid}`) });
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !inspection) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="Recenzare inspecție" subtitle={inspection.templateName} className="mb-6" />

      <Card className="mb-6">
        <ComplianceBar
          compliant={inspection.compliantItems}
          nonCompliant={inspection.nonCompliantItems}
          total={inspection.totalItems}
        />
      </Card>

      {inspection.templateStructure && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Răspunsuri</h3>
          <InspectionItemsView items={inspection.items ?? []} structure={inspection.templateStructure} />
        </div>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Decizia dumneavoastră</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="decision"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-3">
                {DECISIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => field.onChange(d.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      field.value === d.value ? `${d.bg} ${d.color}` : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    )}
                  >
                    <d.icon size={24} />
                    <span className="text-sm font-medium">{d.label}</span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.decision && <p className="text-xs text-danger">{errors.decision.message}</p>}

          {(decision === 'REJECTED' || decision === 'NEEDS_REVISION') && (
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <TextArea
                  label="Motiv (obligatoriu)"
                  placeholder="Descrieți motivul..."
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.reason?.message}
                  rows={3}
                />
              )}
            />
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(`/inspections/${uuid}`)}>
              Anulează
            </Button>
            <Button type="submit" loading={createReview.isPending} disabled={!decision}>
              Trimite recenzia
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
