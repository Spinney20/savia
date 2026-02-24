import { useIssueCategories } from '@/hooks/use-issues';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Spinner, ErrorState } from '@/components/ui';
import { Tags } from 'lucide-react';

export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useIssueCategories();

  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Categorii probleme" subtitle="Gestionați categoriile utilizate pentru raportarea problemelor." className="mb-6" />

      {isLoading ? (
        <Spinner message="Se încarcă..." className="mt-16" />
      ) : (
        <div className="space-y-2">
          {data?.map((cat) => (
            <Card key={cat.uuid}>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: (cat.color ?? '#6b7280') + '20' }}
                >
                  <Tags size={16} style={{ color: cat.color ?? '#6b7280' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
