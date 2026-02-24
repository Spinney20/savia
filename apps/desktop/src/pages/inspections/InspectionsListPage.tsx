import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { InspectionDto } from '@ssm/shared';
import { useInspections } from '@/hooks/use-inspections';
import { usePagination } from '@/hooks/use-pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Button, StatusBadge, SearchInput, EmptyState, ErrorState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, ClipboardCheck } from 'lucide-react';
import { usePermission } from '@/lib/permissions';

const col = createColumnHelper<InspectionDto>();

const columns = [
  col.accessor('templateName', { header: 'Șablon', cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span> }),
  col.accessor('inspectorName', { header: 'Inspector' }),
  col.accessor('status', { header: 'Status', cell: (info) => <StatusBadge status={info.getValue()} type="inspection" /> }),
  col.accessor('riskScore', { header: 'Risc', cell: (info) => info.getValue() != null ? `${info.getValue()}%` : '—' }),
  col.accessor('totalItems', { header: 'Itemi', cell: (info) => `${info.row.original.compliantItems}/${info.getValue()}` }),
  col.accessor('createdAt', { header: 'Data', cell: (info) => formatDate(info.getValue()) }),
];

export default function InspectionsListPage() {
  const navigate = useNavigate();
  const canCreate = usePermission('inspections', 'create');
  const { params, page, search, setPage, setSearch } = usePagination();
  const { data, isLoading, isError, refetch } = useInspections(params);

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6">
      <PageHeader
        title="Inspecții"
        subtitle={data ? `${data.meta.total} inspecții` : undefined}
        actions={
          canCreate && (
            <Button icon={Plus} onClick={() => navigate('/inspections/create')}>
              Inspecție nouă
            </Button>
          )
        }
        className="mb-6"
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Caută inspecții..." className="max-w-sm" />
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          title="Nicio inspecție"
          description="Nu există inspecții înregistrate."
          icon={ClipboardCheck}
          actionLabel={canCreate ? 'Creează inspecție' : undefined}
          onAction={canCreate ? () => navigate('/inspections/create') : undefined}
        />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/inspections/${row.uuid}`)}
        />
      )}
    </div>
  );
}
