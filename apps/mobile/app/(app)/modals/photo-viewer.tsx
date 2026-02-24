import { View, Image, useWindowDimensions, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors } from '@/theme';

export default function PhotoViewerModal() {
  const { uri, title } = useLocalSearchParams<{ uri: string; title?: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black items-center justify-center">
        <Pressable
          onPress={() => router.back()}
          className="absolute top-12 right-4 z-10 bg-black/50 rounded-full p-2"
          accessibilityLabel="Închide"
          accessibilityRole="button"
        >
          <X size={24} color={colors.white} />
        </Pressable>
        {uri && (
          <Image
            source={{ uri }}
            style={{ width, height: height * 0.8 }}
            resizeMode="contain"
            accessibilityLabel={title ?? 'Fotografie'}
          />
        )}
      </View>
    </>
  );
}
