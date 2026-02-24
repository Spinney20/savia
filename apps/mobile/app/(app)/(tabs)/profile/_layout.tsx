import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary.DEFAULT,
        headerTitleStyle: { fontWeight: '600', color: colors.gray[900] },
        headerShadowVisible: false,
      }}
    />
  );
}
