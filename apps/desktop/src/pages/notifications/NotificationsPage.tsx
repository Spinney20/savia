import { useNotifications, useMarkAsRead } from '@/hooks/use-notifications';
import { usePagination } from '@/hooks/use-pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, EmptyState, ErrorState, Spinner, Pagination } from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
  const { params, page, setPage } = usePagination();
  const { data, isLoading, isError, refetch } = useNotifications(params);
  const markAsRead = useMarkAsRead();

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Notificări" className="mb-6" />

      {isLoading ? (
        <Spinner message="Se încarcă..." className="mt-16" />
      ) : data?.data.length === 0 ? (
        <EmptyState title="Nicio notificare" description="Nu aveți notificări." icon={Bell} />
      ) : (
        <>
          <div className="space-y-2">
            {data?.data.map((n) => (
              <Card
                key={n.uuid}
                onClick={() => !n.readAt && markAsRead.mutate(n.uuid)}
                className={cn(!n.readAt && 'border-l-4 border-l-primary')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={cn('text-sm', n.readAt ? 'text-gray-600' : 'text-gray-900 font-medium')}>{n.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {n.readAt && <Check size={16} className="text-gray-400 mt-1" />}
                </div>
              </Card>
            ))}
          </div>
          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
