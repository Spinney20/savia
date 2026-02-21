/**
 * Organization types: Company, Agency, Site
 */

export const SITE_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CLOSED'] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

export interface CompanyDto {
  uuid: string;
  name: string;
  cui: string | null;
  regCom: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  createdAt: string;
}

export interface AgencyDto {
  uuid: string;
  companyUuid: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SiteDto {
  uuid: string;
  agencyUuid: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  geofenceRadius: number;
  status: SiteStatus;
  startDate: string | null;
  estimatedEnd: string | null;
  actualEnd: string | null;
  description: string | null;
  createdAt: string;
}
