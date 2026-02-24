import { View } from 'react-native';
import { Stack } from 'expo-router';
import { OfflineBanner } from '@/components/layout/OfflineBanner';

export default function AppLayout() {
  return (
    <View className="flex-1">
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modals" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
