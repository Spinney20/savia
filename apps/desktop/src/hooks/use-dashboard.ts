import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [inspections, issues, employees] = await Promise.allSettled([
        api.inspections.list({ page: 1, limit: 100 }),
        api.issues.list({ page: 1, limit: 100 }),
        api.employees.list({ page: 1, limit: 100 }),
      ]);

      const inspectionData = inspections.status === 'fulfilled' ? inspections.value : null;
      const issueData = issues.status === 'fulfilled' ? issues.value : null;
      const employeeData = employees.status === 'fulfilled' ? employees.value : null;

      const openIssues = issueData?.data.filter((i) =>
        ['REPORTED', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)
      ).length ?? 0;

      const criticalIssues = issueData?.data.filter((i) =>
        i.severity === 'CRITICAL' && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)
      ).length ?? 0;

      return {
        totalInspections: inspectionData?.meta.total ?? 0,
        openIssues,
        criticalIssues,
        totalEmployees: employeeData?.meta.total ?? 0,
        recentInspections: inspectionData?.data.slice(0, 5) ?? [],
        recentIssues: issueData?.data.slice(0, 5) ?? [],
        allIssues: issueData?.data ?? [],
        allInspections: inspectionData?.data ?? [],
      };
    },
    staleTime: 60_000,
  });
}
