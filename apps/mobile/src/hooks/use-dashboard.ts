import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Fetch dashboard KPI data by aggregating multiple queries */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [issues, inspections, trainings] = await Promise.allSettled([
        api.issues.list({ page: 1, limit: 1 }),
        api.inspections.list({ page: 1, limit: 1 }),
        api.trainings.list({ page: 1, limit: 1 }),
      ]);

      return {
        totalIssues: issues.status === 'fulfilled' ? issues.value.meta.total : 0,
        totalInspections: inspections.status === 'fulfilled' ? inspections.value.meta.total : 0,
        totalTrainings: trainings.status === 'fulfilled' ? trainings.value.meta.total : 0,
      };
    },
    staleTime: 60_000, // 1 min
  });
}
