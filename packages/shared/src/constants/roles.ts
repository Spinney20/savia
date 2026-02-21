import type { Role } from '../types/user.types.js';

/**
 * Role hierarchy — higher index = higher privilege.
 * ADMIN > MANAGER_SSM > SEF_AGENTIE > INSPECTOR_SSM > SEF_SANTIER > MUNCITOR
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  MUNCITOR: 0,
  SEF_SANTIER: 1,
  INSPECTOR_SSM: 2,
  SEF_AGENTIE: 3,
  MANAGER_SSM: 4,
  ADMIN: 5,
};

/** Romanian labels for roles */
export const ROLE_LABELS_RO: Record<Role, string> = {
  ADMIN: 'Administrator',
  MANAGER_SSM: 'Manager SSM',
  SEF_AGENTIE: 'Șef Agenție',
  INSPECTOR_SSM: 'Inspector SSM',
  SEF_SANTIER: 'Șef Șantier',
  MUNCITOR: 'Muncitor',
};

/** Check if roleA has higher or equal privilege than roleB */
export function isRoleAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}
