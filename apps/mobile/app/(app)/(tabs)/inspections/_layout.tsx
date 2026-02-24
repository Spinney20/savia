import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function InspectionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary.DEFAULT,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Inspecții' }}
      />
      <Stack.Screen
        name="[uuid]"
        options={{ title: 'Detalii inspecție' }}
      />
      <Stack.Screen
        name="create"
        options={{ title: 'Inspecție nouă', presentation: 'modal' }}
      />
    </Stack>
  );
}
