import { View, ScrollView } from 'react-native';
import type { Role } from '@ssm/shared';
import { ROLE_LABELS_RO } from '@ssm/shared';
import { useAuthStore } from '@/stores/auth.store';
import { Text, SafeAreaView, Card, ProgressRing } from '@/components/ui';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useGetMe } from '@/hooks/use-auth';
import { useDashboardStats } from '@/hooks/use-dashboard';
import {
  ClipboardCheck,
  AlertTriangle,
  GraduationCap,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { colors } from '@/theme';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  useGetMe(); // Keep user data fresh
  const { data: stats } = useDashboardStats();

  const role = user?.user?.role as Role | undefined;
  const roleName = role ? ROLE_LABELS_RO[role] : '';
  const firstName = user?.user?.employee?.firstName ?? '';

  return (
    <SafeAreaView>
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <Text variant="bodySmall" muted>Bună ziua,</Text>
          <Text variant="h1" className="text-gray-900">{firstName}</Text>
          <Text variant="caption" className="text-primary mt-1">{roleName}</Text>
        </View>

        {/* KPI Cards */}
        <View className="px-4 flex-row flex-wrap gap-3 mb-6">
          <KpiCard
            title="Inspecții luna aceasta"
            value={stats?.totalInspections ?? 0}
            icon={ClipboardCheck}
            color={colors.primary.DEFAULT}
          />
          <KpiCard
            title="Probleme deschise"
            value={stats?.totalIssues ?? 0}
            icon={AlertTriangle}
            color={colors.warning}
          />
          <KpiCard
            title="Instructaje"
            value={stats?.totalTrainings ?? 0}
            icon={GraduationCap}
            color={colors.success}
          />
          <KpiCard
            title="Angajați activi"
            value={0}
            icon={Users}
            color={colors.info}
          />
        </View>

        {/* Compliance Score */}
        <View className="px-4 mb-6">
          <Card>
            <View className="flex-row items-center gap-4">
              <ProgressRing progress={0} size={80} color={colors.primary.DEFAULT} />
              <View className="flex-1">
                <Text variant="h3">Scor conformitate</Text>
                <Text variant="bodySmall" muted className="mt-1">
                  Nu există date pentru luna curentă
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <View className="px-4">
          <Text variant="overline" muted className="mb-3">Acțiuni rapide</Text>
          <View className="gap-3">
            <Card className="flex-row items-center gap-3">
              <View className="bg-warning-50 rounded-xl p-2.5">
                <Clock size={20} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text variant="body" className="font-medium">Documente expirate</Text>
                <Text variant="caption" muted>0 documente necesită atenție</Text>
              </View>
              <TrendingUp size={18} color={colors.gray[400]} />
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
