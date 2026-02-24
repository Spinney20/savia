import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ label, color = 'text-gray-700', bgColor = 'bg-gray-100', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        color,
        bgColor,
        className,
      )}
    >
      {label}
    </span>
  );
}
