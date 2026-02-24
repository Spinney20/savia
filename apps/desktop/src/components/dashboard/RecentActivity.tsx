import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { InspectionDto, IssueReportDto } from '@ssm/shared';
import { ClipboardCheck, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui';

interface RecentActivityProps {
  inspections: InspectionDto[];
  issues: IssueReportDto[];
}

type ActivityItem =
  | { type: 'inspection'; data: InspectionDto; date: Date }
  | { type: 'issue'; data: IssueReportDto; date: Date };

export function RecentActivity({ inspections, issues }: RecentActivityProps) {
  const navigate = useNavigate();

  const items: ActivityItem[] = [
    ...inspections.map((d) => ({ type: 'inspection' as const, data: d, date: new Date(d.createdAt) })),
    ...issues.map((d) => ({ type: 'issue' as const, data: d, date: new Date(d.createdAt) })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Activitate recentă</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Nicio activitate recentă.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.data.uuid}
              onClick={() => navigate(item.type === 'inspection' ? `/inspections/${item.data.uuid}` : `/issues/${item.data.uuid}`)}
              className="w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                {item.type === 'inspection' ? (
                  <ClipboardCheck size={14} className="text-primary" />
                ) : (
                  <AlertCircle size={14} className="text-warning-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {item.type === 'inspection' ? item.data.templateName : (item.data as IssueReportDto).title}
                </p>
                <p className="text-xs text-gray-400">
                  {format(item.date, 'dd MMM, HH:mm', { locale: ro })}
                </p>
              </div>
              <StatusBadge
                status={item.data.status}
                type={item.type === 'inspection' ? 'inspection' : 'issue'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
