import type { IssueReportDto } from '@ssm/shared';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { SeverityBadge } from '@/components/ui';

interface AlertsPanelProps {
  criticalIssues: IssueReportDto[];
}

export function AlertsPanel({ criticalIssues }: AlertsPanelProps) {
  const navigate = useNavigate();

  if (criticalIssues.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Alerte</h3>
        <div className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center">
            <span className="text-success-600 text-lg">✓</span>
          </div>
          <p className="text-sm text-gray-600">Nu există alerte critice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-danger-100 shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-danger" />
        <h3 className="text-sm font-semibold text-danger">
          Alerte critice ({criticalIssues.length})
        </h3>
      </div>
      <div className="space-y-2">
        {criticalIssues.slice(0, 5).map((issue) => (
          <button
            key={issue.uuid}
            onClick={() => navigate(`/issues/${issue.uuid}`)}
            className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-danger-50/50 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{issue.title}</p>
              <p className="text-xs text-gray-500">{issue.reporterName}</p>
            </div>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={issue.severity} />
              <ArrowRight size={14} className="text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
