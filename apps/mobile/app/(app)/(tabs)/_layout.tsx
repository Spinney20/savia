import { Tabs } from 'expo-router';
import {
  Home,
  ClipboardCheck,
  GraduationCap,
  AlertTriangle,
  Users,
  User,
  Bell,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { Role } from '@ssm/shared';
import { isRoleAtLeast, ROLES } from '@ssm/shared';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme';

interface TabConfig {
  name: string;
  label: string;
  icon: LucideIcon;
  minRole?: Role;
}

const ALL_TABS: TabConfig[] = [
  { name: 'home', label: 'Acasă', icon: Home },
  { name: 'inspections', label: 'Inspecții', icon: ClipboardCheck, minRole: 'INSPECTOR_SSM' },
  { name: 'trainings', label: 'Instructaje', icon: GraduationCap },
  { name: 'issues', label: 'Probleme', icon: AlertTriangle },
  { name: 'employees', label: 'Angajați', icon: Users, minRole: 'SEF_SANTIER' },
  { name: 'notifications', label: 'Notificări', icon: Bell },
  { name: 'profile', label: 'Profil', icon: User },
];

function getVisibleTabs(role: Role): Set<string> {
  const visible = new Set<string>();
  for (const tab of ALL_TABS) {
    if (!tab.minRole || isRoleAtLeast(role, tab.minRole)) {
      visible.add(tab.name);
    }
  }
  return visible;
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const rawRole = user?.user?.role;
  const role = rawRole && (ROLES as readonly string[]).includes(rawRole) ? (rawRole as Role) : undefined;
  const visibleTabs = role ? getVisibleTabs(role) : new Set(['home', 'profile']);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {ALL_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => <tab.icon size={size} color={color} />,
            href: visibleTabs.has(tab.name) ? undefined : null, // null hides the tab
          }}
        />
      ))}
    </Tabs>
  );
}
