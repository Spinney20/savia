import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { InspectionTemplateDto } from '@ssm/shared';
import { useTemplates } from '@/hooks/use-templates';
import { usePagination } from '@/hooks/use-pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Badge, SearchInput, EmptyState, ErrorState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, FileText } from 'lucide-react';
import { usePermission } from '@/lib/permissions';

const col = createColumnHelper<InspectionTemplateDto>();

const columns = [
  col.accessor('name', { header: 'Nume', cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span> }),
  col.accessor('category', { header: 'Categorie', cell: (info) => info.getValue() ?? '—' }),
  col.accessor('currentVersionNumber', { header: 'Versiune', cell: (info) => info.getValue() ? `v${info.getValue()}` : '—' }),
  col.accessor('isActive', {
    header: 'Status',
    cell: (info) => (
      <Badge
        label={info.getValue() ? 'Activ' : 'Inactiv'}
        color={info.getValue() ? 'text-success-600' : 'text-gray-500'}
        bgColor={info.getValue() ? 'bg-success-50' : 'bg-gray-100'}
      />
    ),
  }),
  col.accessor('createdAt', { header: 'Creat', cell: (info) => formatDate(info.getValue()) }),
];

export default function TemplatesListPage() {
  const navigate = useNavigate();
  const canCreate = usePermission('inspection_templates', 'create');
  const { params, page, search, setPage, setSearch } = usePagination();
  const { data, isLoading, isError, refetch } = useTemplates(params);

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6">
      <PageHeader
        title="Șabloane inspecții"
        subtitle={data ? `${data.meta.total} șabloane` : undefined}
        actions={
          canCreate && (
            <Button icon={Plus} onClick={() => navigate('/templates/create')}>
              Șablon nou
            </Button>
          )
        }
        className="mb-6"
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Caută șabloane..." className="max-w-sm" />
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          title="Niciun șablon"
          description="Nu există șabloane de inspecție create."
          icon={FileText}
          actionLabel={canCreate ? 'Creează șablon' : undefined}
          onAction={canCreate ? () => navigate('/templates/create') : undefined}
        />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/templates/${row.uuid}`)}
        />
      )}
    </div>
  );
}
