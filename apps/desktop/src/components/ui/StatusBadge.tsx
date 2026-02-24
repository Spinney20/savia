import { INSPECTION_STATUS_LABELS_RO, ISSUE_STATUS_LABELS_RO, EMPLOYEE_STATUS_LABELS_RO } from '@ssm/shared';
import { Badge } from './Badge';

const STATUS_COLORS: Record<string, { color: string; bgColor: string }> = {
  DRAFT: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
  SUBMITTED: { color: 'text-info-600', bgColor: 'bg-info-50' },
  APPROVED: { color: 'text-success-600', bgColor: 'bg-success-50' },
  REJECTED: { color: 'text-danger-600', bgColor: 'bg-danger-50' },
  NEEDS_REVISION: { color: 'text-warning-600', bgColor: 'bg-warning-50' },
  CLOSED: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
  REPORTED: { color: 'text-info-600', bgColor: 'bg-info-50' },
  ASSIGNED: { color: 'text-purple-600', bgColor: 'bg-purple-50' },
  IN_PROGRESS: { color: 'text-warning-600', bgColor: 'bg-warning-50' },
  RESOLVED: { color: 'text-success-600', bgColor: 'bg-success-50' },
  VERIFIED: { color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  REOPENED: { color: 'text-danger-600', bgColor: 'bg-danger-50' },
  ACTIVE: { color: 'text-success-600', bgColor: 'bg-success-50' },
  ON_LEAVE: { color: 'text-warning-600', bgColor: 'bg-warning-50' },
  SUSPENDED: { color: 'text-danger-600', bgColor: 'bg-danger-50' },
  TERMINATED: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const LABEL_MAPS: Record<string, Record<string, string>> = {
  inspection: INSPECTION_STATUS_LABELS_RO,
  issue: ISSUE_STATUS_LABELS_RO,
  employee: EMPLOYEE_STATUS_LABELS_RO,
};

interface StatusBadgeProps {
  status: string;
  type: 'inspection' | 'issue' | 'employee';
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const label = LABEL_MAPS[type]?.[status] ?? status;
  const colors = STATUS_COLORS[status] ?? { color: 'text-gray-600', bgColor: 'bg-gray-100' };
  return <Badge label={label} color={colors.color} bgColor={colors.bgColor} className={className} />;
}
