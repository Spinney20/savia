import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { IssueReportDto } from '@ssm/shared';
import { useIssues } from '@/hooks/use-issues';
import { usePagination } from '@/hooks/use-pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Button, StatusBadge, SeverityBadge, SearchInput, EmptyState, ErrorState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, AlertTriangle, Columns3 } from 'lucide-react';

const col = createColumnHelper<IssueReportDto>();

const columns = [
  col.accessor('title', { header: 'Titlu', cell: (info) => <span className="font-medium text-gray-900 max-w-[250px] truncate block">{info.getValue()}</span> }),
  col.accessor('categoryName', { header: 'Categorie', cell: (info) => info.getValue() ?? '—' }),
  col.accessor('severity', { header: 'Severitate', cell: (info) => <SeverityBadge severity={info.getValue()} /> }),
  col.accessor('status', { header: 'Status', cell: (info) => <StatusBadge status={info.getValue()} type="issue" /> }),
  col.accessor('reporterName', { header: 'Raportor' }),
  col.accessor('reportedAt', { header: 'Data', cell: (info) => formatDate(info.getValue()) }),
];

export default function IssuesListPage() {
  const navigate = useNavigate();
  const { params, page, search, setPage, setSearch } = usePagination();
  const { data, isLoading, isError, refetch } = useIssues(params);

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6">
      <PageHeader
        title="Probleme"
        subtitle={data ? `${data.meta.total} probleme` : undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={Columns3} onClick={() => navigate('/issues/board')}>
              Kanban
            </Button>
            <Button icon={Plus} onClick={() => navigate('/issues/create')}>
              Raportează
            </Button>
          </div>
        }
        className="mb-6"
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Caută probleme..." className="max-w-sm" />
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          title="Nicio problemă"
          description="Nu există probleme raportate."
          icon={AlertTriangle}
          actionLabel="Raportează problemă"
          onAction={() => navigate('/issues/create')}
        />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/issues/${row.uuid}`)}
        />
      )}
    </div>
  );
}
