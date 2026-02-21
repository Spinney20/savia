/**
 * Shared configuration constants
 */

/** Photo compression settings for mobile uploads */
export const PHOTO_MAX_WIDTH = 1280;
export const PHOTO_QUALITY = 0.6;

/** Default geofence radius in meters */
export const DEFAULT_GEOFENCE_RADIUS = 200;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Document expiry warning thresholds (days) */
export const EXPIRY_WARNING_DAYS = 30;
export const EXPIRY_CRITICAL_DAYS = 7;

/** Training intervals in days per type — per HG 1425/2006 */
export const TRAINING_INTERVALS = {
  ANGAJARE: 0,              // one-time
  PERIODIC: 180,            // max 6 months for workers
  PERIODIC_ADMIN: 365,      // max 12 months for admin staff
  SCHIMBARE_LOC_MUNCA: 0,   // on each change
  REVENIRE_MEDICAL: 0,      // on each return
  ZILNIC: 1,                // daily on construction sites
} as const;

/** Storage archival thresholds */
export const STORAGE_RECOMPRESS_AFTER_MONTHS = 6;
export const STORAGE_DELETE_AFTER_MONTHS = 12;
export const STORAGE_RECOMPRESS_WIDTH = 800;
export const STORAGE_RECOMPRESS_QUALITY = 0.3;
