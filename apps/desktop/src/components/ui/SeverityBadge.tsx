import { Badge } from './Badge';

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: 'Scăzut', color: 'text-success-600', bgColor: 'bg-success-50' },
  MEDIUM: { label: 'Mediu', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  HIGH: { label: 'Ridicat', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  CRITICAL: { label: 'Critic', color: 'text-danger-600', bgColor: 'bg-danger-50' },
};

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] ?? { label: severity, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  return <Badge label={config.label} color={config.color} bgColor={config.bgColor} className={className} />;
}
