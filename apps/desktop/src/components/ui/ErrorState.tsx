import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Eroare', description = 'A apărut o eroare. Vă rugăm încercați din nou.', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8', className)}>
      <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-danger" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {onRetry && <Button variant="outline" size="md" onClick={onRetry}>Reîncearcă</Button>}
    </div>
  );
}
