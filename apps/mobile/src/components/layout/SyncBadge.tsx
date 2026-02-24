import { View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { useSyncStore } from '@/stores/sync.store';
import { colors } from '@/theme';

export function SyncBadge() {
  const count = useSyncStore((s) => s.pendingItems.length);
  const isSyncing = useSyncStore((s) => s.isSyncing);

  if (count === 0) return null;

  return (
    <View className="bg-warning-50 flex-row items-center py-1.5 px-3 rounded-full gap-1.5">
      <RefreshCw
        size={14}
        color={colors.warning}
        style={isSyncing ? { opacity: 0.6 } : undefined}
      />
      <Text variant="caption" className="text-warning-600 font-semibold">
        {count} de sincronizat
      </Text>
    </View>
  );
}
