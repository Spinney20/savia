import { useNavigate } from 'react-router-dom';
import type { IssueReportDto } from '@ssm/shared';
import { SeverityBadge, Avatar } from '@/components/ui';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface KanbanCardProps {
  issue: IssueReportDto;
}

export function KanbanCard({ issue }: KanbanCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/issues/${issue.uuid}`)}
      className="w-full bg-white rounded-xl border border-gray-200 p-3 text-left hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">{issue.title}</p>
        <SeverityBadge severity={issue.severity} />
      </div>
      {issue.categoryName && (
        <p className="text-xs text-gray-400 mb-2">{issue.categoryName}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={issue.reporterName} size={20} />
          <span className="text-xs text-gray-500 truncate max-w-[100px]">{issue.reporterName}</span>
        </div>
        <span className="text-[10px] text-gray-400">
          {format(new Date(issue.reportedAt), 'dd MMM', { locale: ro })}
        </span>
      </div>
    </button>
  );
}
