import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  User, Calendar, FileText, Send, Lock, RotateCcw, Trash2,
} from 'lucide-react';
import { useInspection, useSubmitInspection, useCloseInspection, useReviseInspection, useDeleteInspection } from '@/hooks/use-inspections';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComplianceBar } from '@/components/inspections/ComplianceBar';
import { InspectionItemsView } from '@/components/inspections/InspectionItemsView';
import { Card, Tabs, StatusBadge, SeverityBadge, Button, Spinner, ErrorState, ConfirmDialog } from '@/components/ui';
import { usePermission } from '@/lib/permissions';

const REVIEW_DECISION_LABELS: Record<string, string> = {
  APPROVED: 'Aprobat',
  REJECTED: 'Respins',
  NEEDS_REVISION: 'Necesită revizuire',
};
const REVIEW_DECISION_COLORS: Record<string, string> = {
  APPROVED: 'text-success-600',
  REJECTED: 'text-danger-600',
  NEEDS_REVISION: 'text-warning-600',
};

export default function InspectionDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: inspection, isLoading, isError, refetch } = useInspection(uuid!);
  const submitMut = useSubmitInspection();
  const closeMut = useCloseInspection();
  const reviseMut = useReviseInspection();
  const deleteMut = useDeleteInspection();
  const canReview = usePermission('inspections', 'update');
  const [tab, setTab] = useState('details');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !inspection) return <ErrorState onRetry={refetch} className="mt-16" />;

  const canSubmit = inspection.status === 'DRAFT';
  const canClose = inspection.status === 'APPROVED';
  const canRevise = inspection.status === 'NEEDS_REVISION';

  const tabs = [
    { id: 'details', label: 'Detalii' },
    { id: 'items', label: `Răspunsuri (${inspection.items?.length ?? 0})` },
    { id: 'reviews', label: `Recenzii (${inspection.reviews?.length ?? 0})` },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={inspection.templateName}
        subtitle={`Inspector: ${inspection.inspectorName}`}
        actions={
          <div className="flex items-center gap-2">
            {canSubmit && (
              <Button icon={Send} loading={submitMut.isPending} onClick={() => submitMut.mutate(uuid!, { onSuccess: () => { refetch(); } })}>
                Trimite
              </Button>
            )}
            {canRevise && (
              <Button icon={RotateCcw} variant="secondary" loading={reviseMut.isPending} onClick={() => reviseMut.mutate(uuid!, { onSuccess: () => { refetch(); } })}>
                Retrimite
              </Button>
            )}
            {canClose && (
              <Button icon={Lock} variant="outline" loading={closeMut.isPending} onClick={() => closeMut.mutate(uuid!, { onSuccess: () => { refetch(); } })}>
                Închide
              </Button>
            )}
            {canReview && inspection.status === 'SUBMITTED' && (
              <Button variant="secondary" onClick={() => navigate(`/inspections/${uuid}/review`)}>
                Recenzează
              </Button>
            )}
            <Button icon={Trash2} variant="ghost" onClick={() => setDeleteOpen(true)} />
          </div>
        }
        className="mb-6"
      />

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-6" />

      {tab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={inspection.status} type="inspection" />
              {inspection.riskScore != null && (
                <span className="text-sm font-semibold text-primary">Risc: {inspection.riskScore}%</span>
              )}
            </div>
            <ComplianceBar
              compliant={inspection.compliantItems}
              nonCompliant={inspection.nonCompliantItems}
              total={inspection.totalItems}
              className="mb-4"
            />
            {inspection.notes && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Note</p>
                <p className="text-sm text-gray-700">{inspection.notes}</p>
              </div>
            )}
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informații</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User size={15} className="text-gray-400" />
                <span className="text-gray-600">{inspection.inspectorName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={15} className="text-gray-400" />
                <span className="text-gray-600">
                  {format(new Date(inspection.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                </span>
              </div>
              {inspection.submittedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Send size={15} className="text-gray-400" />
                  <span className="text-gray-600">
                    Trimisă: {format(new Date(inspection.submittedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                  </span>
                </div>
              )}
              {inspection.completedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={15} className="text-gray-400" />
                  <span className="text-gray-600">
                    Finalizată: {format(new Date(inspection.completedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'items' && inspection.templateStructure && (
        <InspectionItemsView items={inspection.items ?? []} structure={inspection.templateStructure} />
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {(inspection.reviews ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Nicio recenzie încă.</p>
          ) : (
            inspection.reviews.map((review) => (
              <Card key={`${review.reviewerName}-${review.reviewedAt}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{review.reviewerName}</span>
                  <span className={`text-sm font-medium ${REVIEW_DECISION_COLORS[review.decision] ?? ''}`}>
                    {REVIEW_DECISION_LABELS[review.decision] ?? review.decision}
                  </span>
                </div>
                {review.reason && <p className="text-sm text-gray-600 mb-2">{review.reason}</p>}
                <p className="text-xs text-gray-400">
                  {format(new Date(review.reviewedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                </p>
              </Card>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate(uuid!, { onSuccess: () => navigate('/inspections') })}
        title="Șterge inspecția"
        description="Această acțiune este ireversibilă. Sigur doriți să ștergeți inspecția?"
        confirmLabel="Șterge"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
