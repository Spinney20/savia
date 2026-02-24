import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { useAppStore } from '@/stores/app.store';
import { colors } from '@/theme';

export function OfflineBanner() {
  const isOnline = useAppStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <View className="bg-danger flex-row items-center justify-center py-2 px-4 gap-2">
      <WifiOff size={16} color={colors.white} />
      <Text variant="caption" className="text-white font-semibold">
        Nu ești conectat la internet
      </Text>
    </View>
  );
}
