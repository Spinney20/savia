import { ClipboardCheck, AlertCircle, AlertTriangle, Users } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InspectionChart } from '@/components/dashboard/InspectionChart';
import { IssuesByCategory } from '@/components/dashboard/IssuesByCategory';
import { ResolutionTrend } from '@/components/dashboard/ResolutionTrend';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner, ErrorState } from '@/components/ui';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  if (isLoading) return <div className="flex items-center justify-center h-96"><Spinner message="Se încarcă dashboard..." /></div>;
  if (isError) return <ErrorState onRetry={refetch} className="mt-16" />;
  if (!stats) return null;

  const criticalIssues = stats.allIssues.filter(
    (i) => i.severity === 'CRITICAL' && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status),
  );

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Prezentare generală" className="mb-6" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total inspecții" value={stats.totalInspections} icon={ClipboardCheck} />
        <StatsCard label="Probleme deschise" value={stats.openIssues} icon={AlertCircle} />
        <StatsCard label="Probleme critice" value={stats.criticalIssues} icon={AlertTriangle} />
        <StatsCard label="Total angajați" value={stats.totalEmployees} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InspectionChart inspections={stats.allInspections} />
        <IssuesByCategory issues={stats.allIssues} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ResolutionTrend issues={stats.allIssues} />
        <AlertsPanel criticalIssues={criticalIssues} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <RecentActivity
          inspections={stats.recentInspections}
          issues={stats.recentIssues}
        />
      </div>
    </div>
  );
}
