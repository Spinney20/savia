import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { IssueStatusHistoryDto } from '@ssm/shared';
import { ISSUE_STATUS_LABELS_RO } from '@ssm/shared';

interface StatusTimelineProps {
  history: IssueStatusHistoryDto[];
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-500">Niciun istoric disponibil.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {history.map((entry) => {
          const fromLabel = entry.fromStatus ? ISSUE_STATUS_LABELS_RO[entry.fromStatus] : null;
          const toLabel = ISSUE_STATUS_LABELS_RO[entry.toStatus] ?? entry.toStatus;
          return (
            <div key={`${entry.toStatus}-${entry.changedAt}`} className="relative flex items-start gap-4 pl-6">
              <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-primary border-2 border-white shadow-sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {fromLabel ? `${fromLabel} → ${toLabel}` : toLabel}
                </p>
                <p className="text-xs text-gray-500">
                  {entry.changedByName} &middot;{' '}
                  {format(new Date(entry.changedAt), 'dd MMM yyyy, HH:mm', { locale: ro })}
                </p>
                {entry.reason && (
                  <p className="text-xs text-gray-400 mt-0.5">{entry.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
