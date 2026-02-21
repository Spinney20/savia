/**
 * Geolocation utilities
 */

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Check if a GPS point is within a geofence circle.
 */
export function isInGeofence(
  pointLat: number,
  pointLon: number,
  fenceLat: number,
  fenceLon: number,
  radiusMeters: number,
): boolean {
  return haversineDistance(pointLat, pointLon, fenceLat, fenceLon) <= radiusMeters;
}
