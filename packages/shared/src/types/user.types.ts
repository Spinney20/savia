/**
 * User & role types — mirrors DB schema from Part 1
 */

export const ROLES = [
  'ADMIN',
  'MANAGER_SSM',
  'SEF_AGENTIE',
  'INSPECTOR_SSM',
  'SEF_SANTIER',
  'MUNCITOR',
] as const;

export type Role = (typeof ROLES)[number];

/** Authenticated user payload (from JWT) */
export interface AuthUser {
  userId: number;
  uuid: string;
  employeeId: number;
  companyId: number;
  role: Role;
  email: string;
}

/** User DTO returned by API */
export interface UserDto {
  uuid: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  employee: {
    uuid: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

/** Extended response from GET /auth/me */
export interface AuthMeResponse {
  user: UserDto;
  permissions: string[];
  allocatedAgencies: { uuid: string; name: string }[];
  allocatedSites: { uuid: string; name: string }[];
  minAppVersion: string;
}
