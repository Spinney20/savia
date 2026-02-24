import { ISSUE_STATUSES, type IssueStatus } from '@ssm/shared';
import { useIssues } from '@/hooks/use-issues';
import { KanbanColumn } from '@/components/issues/KanbanColumn';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Spinner, ErrorState } from '@/components/ui';
import { List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BOARD_STATUSES: IssueStatus[] = ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED'];

export default function IssueBoardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useIssues({ limit: 200 });

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă..." /></div>;
  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  const issues = data?.data ?? [];

  return (
    <div className="p-6">
      <PageHeader
        title="Tablou Kanban"
        subtitle={`${issues.length} probleme`}
        actions={
          <Button variant="outline" icon={List} onClick={() => navigate('/issues')}>
            Vizualizare listă
          </Button>
        }
        className="mb-6"
      />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            issues={issues.filter((i) => i.status === status)}
          />
        ))}
      </div>
    </div>
  );
}
