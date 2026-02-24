import type { Severity } from '@ssm/shared';
import { Badge } from './Badge';

const severityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-success-50', text: 'text-success-600', label: 'Scăzut' },
  MEDIUM: { bg: 'bg-warning-50', text: 'text-warning-600', label: 'Mediu' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Ridicat' },
  CRITICAL: { bg: 'bg-danger-50', text: 'text-danger-600', label: 'Critic' },
};

interface SeverityBadgeProps {
  severity: Severity | string;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity] ?? severityConfig.MEDIUM!;
  return (
    <Badge
      label={config.label}
      bgColor={config.bg}
      color={config.text}
      className={className}
    />
  );
}
