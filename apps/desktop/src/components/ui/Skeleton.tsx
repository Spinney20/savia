import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-200', className)} style={{ width, height }} />;
}
