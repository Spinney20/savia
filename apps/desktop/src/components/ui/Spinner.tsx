import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  message?: string;
}

export function Spinner({ size = 24, className, message }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 size={size} className="animate-spin text-primary" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
