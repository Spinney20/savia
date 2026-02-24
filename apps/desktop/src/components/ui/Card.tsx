import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  padded?: boolean;
}

export function Card({ children, onClick, className, padded = true }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-card',
        padded && 'p-5',
        onClick && 'text-left w-full hover:shadow-card-hover hover:border-gray-200 transition-all duration-200 cursor-pointer',
        className,
      )}
    >
      {children}
    </Component>
  );
}
