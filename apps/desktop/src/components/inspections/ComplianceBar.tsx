import { cn } from '@/lib/utils';

interface ComplianceBarProps {
  compliant: number;
  nonCompliant: number;
  total: number;
  className?: string;
}

export function ComplianceBar({ compliant, nonCompliant, total, className }: ComplianceBarProps) {
  if (total === 0) return null;

  const compliantPct = Math.round((compliant / total) * 100);
  const nonCompliantPct = Math.round((nonCompliant / total) * 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
        <span className="text-success-600">Conform: {compliant}/{total} ({compliantPct}%)</span>
        <span className="text-danger-600">Neconform: {nonCompliant}/{total} ({nonCompliantPct}%)</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        {compliantPct > 0 && (
          <div
            className="bg-success transition-all duration-500"
            style={{ width: `${compliantPct}%` }}
          />
        )}
        {nonCompliantPct > 0 && (
          <div
            className="bg-danger transition-all duration-500"
            style={{ width: `${nonCompliantPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
