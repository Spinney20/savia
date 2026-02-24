import {
  INSPECTION_STATUS_LABELS_RO,
  ISSUE_STATUS_LABELS_RO,
  EMPLOYEE_STATUS_LABELS_RO,
  type InspectionStatus,
  type IssueStatus,
  type EmployeeStatus,
} from '@ssm/shared';
import { Badge } from './Badge';
import { colors } from '@/theme';

type StatusType = 'inspection' | 'issue' | 'employee';

const labelsMap = {
  inspection: INSPECTION_STATUS_LABELS_RO,
  issue: ISSUE_STATUS_LABELS_RO,
  employee: EMPLOYEE_STATUS_LABELS_RO,
} as const;

const colorMap: Record<StatusType, Record<string, { bg: string; text: string }>> = {
  inspection: {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600' },
    SUBMITTED: { bg: 'bg-info-50', text: 'text-info-600' },
    APPROVED: { bg: 'bg-success-50', text: 'text-success-600' },
    REJECTED: { bg: 'bg-danger-50', text: 'text-danger-600' },
    NEEDS_REVISION: { bg: 'bg-warning-50', text: 'text-warning-600' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  },
  issue: {
    REPORTED: { bg: 'bg-info-50', text: 'text-info-600' },
    ASSIGNED: { bg: 'bg-purple-50', text: 'text-purple-600' },
    IN_PROGRESS: { bg: 'bg-warning-50', text: 'text-warning-600' },
    RESOLVED: { bg: 'bg-success-50', text: 'text-success-600' },
    VERIFIED: { bg: 'bg-success-50', text: 'text-success-600' },
    REOPENED: { bg: 'bg-danger-50', text: 'text-danger-600' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  },
  employee: {
    ACTIVE: { bg: 'bg-success-50', text: 'text-success-600' },
    ON_LEAVE: { bg: 'bg-warning-50', text: 'text-warning-600' },
    SUSPENDED: { bg: 'bg-danger-50', text: 'text-danger-600' },
    TERMINATED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  },
};

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const labels = labelsMap[type] as Record<string, string>;
  const colorConfig = colorMap[type]?.[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <Badge
      label={labels[status] ?? status}
      bgColor={colorConfig.bg}
      color={colorConfig.text}
      className={className}
    />
  );
}
