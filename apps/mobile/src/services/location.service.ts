import * as Location from 'expo-location';
import { isInGeofence } from '@ssm/shared';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export async function getCurrentLocation(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permisiunea pentru locație a fost refuzată');

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}

interface SiteWithCoords {
  uuid: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadius?: number;
}

export function findNearestSite(
  coords: Coords,
  sites: SiteWithCoords[],
  defaultRadius = 200,
): SiteWithCoords | null {
  for (const site of sites) {
    if (site.latitude == null || site.longitude == null) continue;
    const radius = site.geofenceRadius ?? defaultRadius;
    if (isInGeofence(coords.latitude, coords.longitude, site.latitude, site.longitude, radius)) {
      return site;
    }
  }
  return null;
}
