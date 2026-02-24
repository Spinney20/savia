import type { IssueReportDto, IssueStatus } from '@ssm/shared';
import { ISSUE_STATUS_LABELS_RO } from '@ssm/shared';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

const COLUMN_COLORS: Record<string, string> = {
  REPORTED: 'border-t-info-500',
  ASSIGNED: 'border-t-purple-500',
  IN_PROGRESS: 'border-t-warning-500',
  RESOLVED: 'border-t-success-500',
  VERIFIED: 'border-t-emerald-500',
  REOPENED: 'border-t-danger-500',
  CLOSED: 'border-t-gray-400',
};

interface KanbanColumnProps {
  status: IssueStatus;
  issues: IssueReportDto[];
}

export function KanbanColumn({ status, issues }: KanbanColumnProps) {
  return (
    <div className={cn(
      'flex flex-col min-w-[260px] max-w-[300px] bg-gray-50 rounded-xl border-t-4',
      COLUMN_COLORS[status] ?? 'border-t-gray-300',
    )}>
      <div className="px-3 py-2.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {ISSUE_STATUS_LABELS_RO[status] ?? status}
        </h3>
        <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full">
          {issues.length}
        </span>
      </div>
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]">
        {issues.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nicio problemă</p>
        ) : (
          issues.map((issue) => <KanbanCard key={issue.uuid} issue={issue} />)
        )}
      </div>
    </div>
  );
}
