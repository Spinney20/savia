import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { EmployeeDto } from '@ssm/shared';
import { useEmployees } from '@/hooks/use-employees';
import { usePagination } from '@/hooks/use-pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Button, StatusBadge, SearchInput, EmptyState, ErrorState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, Users } from 'lucide-react';
import { usePermission } from '@/lib/permissions';

const col = createColumnHelper<EmployeeDto>();

const columns = [
  col.display({
    id: 'name',
    header: 'Nume',
    cell: (info) => (
      <span className="font-medium text-gray-900">
        {info.row.original.firstName} {info.row.original.lastName}
      </span>
    ),
  }),
  col.accessor('jobTitle', { header: 'Funcție', cell: (info) => info.getValue() ?? '—' }),
  col.accessor('status', { header: 'Status', cell: (info) => <StatusBadge status={info.getValue()} type="employee" /> }),
  col.accessor('email', { header: 'Email', cell: (info) => info.getValue() ?? '—' }),
  col.accessor('phone', { header: 'Telefon', cell: (info) => info.getValue() ?? '—' }),
  col.accessor('hireDate', { header: 'Data angajării', cell: (info) => info.getValue() ? formatDate(info.getValue()!) : '—' }),
];

export default function EmployeesListPage() {
  const navigate = useNavigate();
  const canCreate = usePermission('employees', 'create');
  const { params, page, search, setPage, setSearch } = usePagination();
  const { data, isLoading, isError, refetch } = useEmployees(params);

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6">
      <PageHeader
        title="Angajați"
        subtitle={data ? `${data.meta.total} angajați` : undefined}
        actions={
          canCreate && (
            <Button icon={Plus} onClick={() => navigate('/employees/create')}>
              Angajat nou
            </Button>
          )
        }
        className="mb-6"
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Caută angajați..." className="max-w-sm" />
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          title="Niciun angajat"
          description="Nu există angajați înregistrați."
          icon={Users}
          actionLabel={canCreate ? 'Adaugă angajat' : undefined}
          onAction={canCreate ? () => navigate('/employees/create') : undefined}
        />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/employees/${row.uuid}`)}
        />
      )}
    </div>
  );
}
