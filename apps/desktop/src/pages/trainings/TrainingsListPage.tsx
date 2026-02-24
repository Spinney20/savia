import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { TrainingDto } from '@ssm/shared';
import { useTrainings } from '@/hooks/use-trainings';
import { usePagination } from '@/hooks/use-pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Badge, SearchInput, EmptyState, ErrorState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { Plus, GraduationCap } from 'lucide-react';
import { usePermission } from '@/lib/permissions';

const TRAINING_TYPE_LABELS: Record<string, string> = {
  ANGAJARE: 'Angajare',
  PERIODIC: 'Periodic',
  SCHIMBARE_LOC_MUNCA: 'Schimbare loc',
  REVENIRE_MEDICAL: 'Revenire',
  SPECIAL: 'Special',
  ZILNIC: 'Zilnic',
};

const col = createColumnHelper<TrainingDto>();

const columns = [
  col.accessor('title', { header: 'Titlu', cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span> }),
  col.accessor('trainingType', {
    header: 'Tip',
    cell: (info) => <Badge label={TRAINING_TYPE_LABELS[info.getValue()] ?? info.getValue()} bgColor="bg-primary-50" color="text-primary" />,
  }),
  col.accessor('conductorName', { header: 'Condus de' }),
  col.accessor('participantCount', { header: 'Participanți' }),
  col.accessor('conductedAt', { header: 'Data', cell: (info) => formatDateTime(info.getValue()) }),
];

export default function TrainingsListPage() {
  const navigate = useNavigate();
  const canCreate = usePermission('trainings', 'create');
  const { params, page, search, setPage, setSearch } = usePagination();
  const { data, isLoading, isError, refetch } = useTrainings(params);

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6">
      <PageHeader
        title="Instruiri"
        subtitle={data ? `${data.meta.total} instruiri` : undefined}
        actions={
          canCreate && (
            <Button icon={Plus} onClick={() => navigate('/trainings/create')}>
              Instruire nouă
            </Button>
          )
        }
        className="mb-6"
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Caută instruiri..." className="max-w-sm" />
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          title="Nicio instruire"
          description="Nu există instruiri înregistrate."
          icon={GraduationCap}
          actionLabel={canCreate ? 'Creează instruire' : undefined}
          onAction={canCreate ? () => navigate('/trainings/create') : undefined}
        />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/trainings/${row.uuid}`)}
        />
      )}
    </div>
  );
}
