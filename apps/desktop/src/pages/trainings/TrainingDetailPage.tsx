import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, Users, Clock, Trash2 } from 'lucide-react';
import { useTraining, useDeleteTraining } from '@/hooks/use-trainings';
import { ParticipantsList } from '@/components/trainings/ParticipantsList';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Tabs, Badge, Button, Spinner, ErrorState, ConfirmDialog } from '@/components/ui';

const TRAINING_TYPE_LABELS: Record<string, string> = {
  ANGAJARE: 'La angajare',
  PERIODIC: 'Periodic',
  SCHIMBARE_LOC_MUNCA: 'Schimbare loc de muncă',
  REVENIRE_MEDICAL: 'Revenire medicală',
  SPECIAL: 'Special',
  ZILNIC: 'Zilnic',
};

export default function TrainingDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: training, isLoading, isError, refetch } = useTraining(uuid!);
  const deleteMut = useDeleteTraining();
  const [tab, setTab] = useState('details');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError || !training) return <ErrorState onRetry={refetch} className="mt-16" />;

  const tabs = [
    { id: 'details', label: 'Detalii' },
    { id: 'participants', label: `Participanți (${training.participants?.length ?? training.participantCount})` },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={training.title}
        subtitle={`Condus de ${training.conductorName}`}
        actions={
          <div className="flex items-center gap-2">
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
              <Badge
                label={TRAINING_TYPE_LABELS[training.trainingType] ?? training.trainingType}
                color="text-primary"
                bgColor="bg-primary-50"
              />
            </div>

            {training.description && (
              <p className="text-sm text-gray-700 mb-4">{training.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={15} className="text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(training.conductedAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                  </span>
                </div>
                {training.durationMinutes && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={15} className="text-gray-400" />
                    <span className="text-gray-600">{training.durationMinutes} minute</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={15} className="text-gray-400" />
                  <span className="text-gray-600">{training.participantCount} participanți</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rezumat</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Tip: {TRAINING_TYPE_LABELS[training.trainingType] ?? training.trainingType}</p>
              <p>Conductor: {training.conductorName}</p>
              <p>Creat: {format(new Date(training.createdAt), 'dd MMM yyyy', { locale: ro })}</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'participants' && (
        <ParticipantsList participants={training.participants ?? []} />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate(uuid!, { onSuccess: () => navigate('/trainings') })}
        title="Șterge instructajul"
        description="Această acțiune este ireversibilă. Sigur doriți să ștergeți instructajul?"
        confirmLabel="Șterge"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
