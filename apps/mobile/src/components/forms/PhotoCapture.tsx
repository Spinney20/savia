import { useState } from 'react';
import { View, Image, Pressable, ScrollView } from 'react-native';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { Text, Button } from '@/components/ui';
import { capturePhoto, pickFromGallery, type LocalPhoto } from '@/services/camera.service';
import { colors } from '@/theme';
import Toast from 'react-native-toast-message';

interface PhotoCaptureProps {
  photos: LocalPhoto[];
  onPhotosChange: (photos: LocalPhoto[]) => void;
  maxPhotos?: number;
  label?: string;
}

export function PhotoCapture({ photos, onPhotosChange, maxPhotos = 5, label }: PhotoCaptureProps) {
  const [loading, setLoading] = useState(false);

  const handleCapture = async () => {
    if (photos.length >= maxPhotos) {
      Toast.show({ type: 'info', text1: `Maxim ${maxPhotos} fotografii` });
      return;
    }
    setLoading(true);
    try {
      const photo = await capturePhoto();
      onPhotosChange([...photos, photo]);
    } catch (e: any) {
      if (e.message !== 'Anulat') {
        Toast.show({ type: 'error', text1: 'Eroare cameră', text2: e.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async () => {
    if (photos.length >= maxPhotos) return;
    setLoading(true);
    try {
      const photo = await pickFromGallery();
      onPhotosChange([...photos, photo]);
    } catch (e: any) {
      if (e.message !== 'Anulat') {
        Toast.show({ type: 'error', text1: 'Eroare galerie', text2: e.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View className="gap-2">
      {label && <Text variant="bodySmall" className="text-gray-700 font-medium">{label}</Text>}

      {/* Photo previews */}
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {photos.map((photo, index) => (
              <View key={photo.uri} className="relative">
                <Image
                  source={{ uri: photo.uri }}
                  className="w-20 h-20 rounded-xl"
                />
                <Pressable
                  onPress={() => handleRemove(index)}
                  className="absolute -top-1 -right-1 bg-danger rounded-full w-5 h-5 items-center justify-center"
                >
                  <X size={12} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={Camera}
          loading={loading}
          onPress={handleCapture}
        >
          Cameră
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={ImagePlus}
          loading={loading}
          onPress={handlePick}
        >
          Galerie
        </Button>
      </View>

      <Text variant="caption" muted>{photos.length}/{maxPhotos} fotografii</Text>
    </View>
  );
}
