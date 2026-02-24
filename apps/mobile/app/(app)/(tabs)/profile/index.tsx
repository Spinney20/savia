import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Settings, Lock, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { Text, Card, Avatar, Button, Divider } from '@/components/ui';
import { colors } from '@/theme';
import { Pressable } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  const employee = user.user?.employee;
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : user.user?.email ?? '';

  const menuItems = [
    {
      label: 'Setări',
      icon: Settings,
      onPress: () => router.push('/(app)/(tabs)/profile/settings'),
    },
    {
      label: 'Schimbă parola',
      icon: Lock,
      onPress: () => router.push('/(app)/(tabs)/profile/change-password'),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-32">
      {/* Profile header */}
      <Card className="mx-4 mt-4">
        <View className="items-center">
          <Avatar name={fullName} size={72} />
          <Text variant="h2" className="text-gray-900 mt-3">{fullName}</Text>
          <Text variant="bodySmall" muted className="mt-1">{user.user.email}</Text>
          <Text variant="caption" className="text-primary mt-1">{user.user.role}</Text>
        </View>
      </Card>

      {/* Menu */}
      <Card className="mx-4 mt-4">
        {menuItems.map((item, i) => (
          <View key={item.label}>
            {i > 0 && <Divider />}
            <Pressable
              onPress={item.onPress}
              className="flex-row items-center py-3"
            >
              <item.icon size={20} color={colors.gray[600]} />
              <Text variant="body" className="flex-1 ml-3 text-gray-900">{item.label}</Text>
              <ChevronRight size={18} color={colors.gray[400]} />
            </Pressable>
          </View>
        ))}
      </Card>

      {/* Logout */}
      <View className="px-4 mt-6">
        <Button
          variant="outline"
          size="lg"
          icon={LogOut}
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        >
          Deconectare
        </Button>
      </View>

      <Text variant="caption" muted className="text-center mt-6">
        Savia SSM v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}
