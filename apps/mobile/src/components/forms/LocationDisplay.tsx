import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { MapPin, RefreshCw } from 'lucide-react-native';
import { Text, Spinner } from '@/components/ui';
import { getCurrentLocation, type Coords } from '@/services/location.service';
import { colors } from '@/theme';

interface LocationDisplayProps {
  coords: Coords | null;
  onCoordsChange: (coords: Coords) => void;
  siteName?: string | null;
  autoCapture?: boolean;
}

export function LocationDisplay({
  coords,
  onCoordsChange,
  siteName,
  autoCapture = true,
}: LocationDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCoordsChangeRef = useRef(onCoordsChange);
  onCoordsChangeRef.current = onCoordsChange;

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      onCoordsChangeRef.current(loc);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoCapture && !coords) {
      fetchLocation();
    }
  }, [autoCapture, coords, fetchLocation]);

  return (
    <View className="bg-gray-50 rounded-xl p-3 flex-row items-center gap-3">
      <MapPin size={20} color={coords ? colors.primary.DEFAULT : colors.gray[400]} />
      <View className="flex-1">
        {loading ? (
          <Spinner size="small" message="Se obține locația..." />
        ) : error ? (
          <Text variant="caption" className="text-danger">{error}</Text>
        ) : coords ? (
          <>
            <Text variant="bodySmall" className="text-gray-900">
              {siteName ?? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`}
            </Text>
            {siteName && (
              <Text variant="caption" muted>
                {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </Text>
            )}
          </>
        ) : (
          <Text variant="bodySmall" muted>Locația nu a fost obținută</Text>
        )}
      </View>
      <Pressable
        onPress={fetchLocation}
        hitSlop={16}
        accessibilityLabel="Reîncarcă locația"
        accessibilityRole="button"
      >
        <RefreshCw size={18} color={colors.gray[500]} />
      </Pressable>
    </View>
  );
}
