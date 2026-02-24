import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, SafeAreaView } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView>
      <View className="flex-1 items-center justify-center px-8">
        <Text variant="h1" className="text-gray-300 mb-4">404</Text>
        <Text variant="h3" className="text-gray-800 mb-2">Pagina nu a fost găsită</Text>
        <Text variant="bodySmall" muted className="text-center mb-8">
          Ne pare rău, pagina pe care o căutați nu există.
        </Text>
        <Button variant="primary" onPress={() => router.replace('/')}>
          Înapoi la acasă
        </Button>
      </View>
    </SafeAreaView>
  );
}
