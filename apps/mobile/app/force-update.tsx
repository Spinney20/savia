import { View, Linking } from 'react-native';
import { Download } from 'lucide-react-native';
import { Text, Button, SafeAreaView } from '@/components/ui';
import { colors } from '@/theme';

export default function ForceUpdateScreen() {
  const handleUpdate = () => {
    // Link to Play Store — update with actual store URL when published
    Linking.openURL('https://play.google.com/store');
  };

  return (
    <SafeAreaView>
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-primary-50 rounded-full p-6 mb-6">
          <Download size={56} color={colors.primary.DEFAULT} strokeWidth={1.5} />
        </View>
        <Text variant="h2" className="text-center mb-3">Actualizare necesară</Text>
        <Text variant="body" muted className="text-center mb-8">
          O nouă versiune a aplicației Savia SSM este disponibilă. Vă rugăm să actualizați pentru a continua.
        </Text>
        <Button variant="primary" size="lg" onPress={handleUpdate}>
          Actualizează acum
        </Button>
      </View>
    </SafeAreaView>
  );
}
