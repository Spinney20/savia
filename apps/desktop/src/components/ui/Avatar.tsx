import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const COLORS = [
  'bg-primary-100 text-primary-700',
  'bg-success-50 text-success-600',
  'bg-warning-50 text-warning-600',
  'bg-info-50 text-info-600',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

export function Avatar({ name, size = 40, className }: AvatarProps) {
  const initials = getInitials(name);
  const colorClass = hashColor(name);
  const fontSize = size < 32 ? 'text-xs' : size < 48 ? 'text-sm' : 'text-base';

  return (
    <div
      className={cn('inline-flex items-center justify-center rounded-full font-semibold', colorClass, fontSize, className)}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
