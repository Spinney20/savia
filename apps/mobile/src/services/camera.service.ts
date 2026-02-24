import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { PHOTO_MAX_WIDTH, PHOTO_QUALITY } from '@ssm/shared';

export interface LocalPhoto {
  uri: string;
  width: number;
  height: number;
}

export async function capturePhoto(): Promise<LocalPhoto> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Permisiunea pentru cameră a fost refuzată');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled) throw new Error('Anulat');

  const asset = result.assets[0]!;
  return compressPhoto(asset.uri);
}

export async function pickFromGallery(): Promise<LocalPhoto> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Permisiunea pentru galerie a fost refuzată');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsMultipleSelection: false,
  });
  if (result.canceled) throw new Error('Anulat');

  const asset = result.assets[0]!;
  return compressPhoto(asset.uri);
}

async function compressPhoto(uri: string): Promise<LocalPhoto> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: PHOTO_MAX_WIDTH } }],
    { compress: PHOTO_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return {
    uri: manipulated.uri,
    width: manipulated.width,
    height: manipulated.height,
  };
}
