import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function IssuesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary.DEFAULT,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Probleme' }} />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalii problemă' }} />
      <Stack.Screen name="create" options={{ title: 'Raportează problemă', presentation: 'modal' }} />
    </Stack>
  );
}
