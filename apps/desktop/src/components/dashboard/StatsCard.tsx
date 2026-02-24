import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex items-start gap-4',
      className,
    )}>
      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
        <Icon size={22} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {trend && (
          <p className={cn(
            'text-xs font-medium mt-1',
            trend.positive ? 'text-success-600' : 'text-danger-600',
          )}>
            {trend.positive ? '+' : ''}{trend.value}%
          </p>
        )}
      </div>
    </div>
  );
}
