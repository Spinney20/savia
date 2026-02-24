import { View, ScrollView, Pressable } from 'react-native';
import Constants from 'expo-constants';
import { Bell, Wifi, Database, Info, ChevronRight } from 'lucide-react-native';
import { Text, Card, Divider, Switch } from '@/components/ui';
import { colors } from '@/theme';
import { useAppStore } from '@/stores/app.store';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-32">
      <Card className="mx-4 mt-4">
        <Text variant="overline" className="text-gray-500 mb-3">GENERAL</Text>

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-3">
            <Bell size={20} color={colors.gray[600]} />
            <Text variant="body" className="text-gray-900">Notificări push</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <Divider />

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-3">
            <Wifi size={20} color={colors.gray[600]} />
            <Text variant="body" className="text-gray-900">Sincronizare automată</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>
      </Card>

      <Card className="mx-4 mt-4">
        <Text variant="overline" className="text-gray-500 mb-3">DESPRE</Text>

        <Pressable className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-3">
            <Info size={20} color={colors.gray[600]} />
            <Text variant="body" className="text-gray-900">Versiune</Text>
          </View>
          <Text variant="bodySmall" muted>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </Pressable>

        <Divider />

        <Pressable className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-3">
            <Database size={20} color={colors.gray[600]} />
            <Text variant="body" className="text-gray-900">Cache local</Text>
          </View>
          <ChevronRight size={18} color={colors.gray[400]} />
        </Pressable>
      </Card>
    </ScrollView>
  );
}
