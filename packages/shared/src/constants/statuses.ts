import type { InspectionStatus } from '../types/inspection.types.js';
import type { IssueStatus } from '../types/issue.types.js';
import type { SiteStatus } from '../types/organization.types.js';
import type { EmployeeStatus } from '../types/employee.types.js';

/** Romanian labels for inspection statuses */
export const INSPECTION_STATUS_LABELS_RO: Record<InspectionStatus, string> = {
  DRAFT: 'Ciornă',
  SUBMITTED: 'Trimisă',
  APPROVED: 'Aprobată',
  REJECTED: 'Respinsă',
  NEEDS_REVISION: 'Necesită revizuire',
  CLOSED: 'Închisă',
};

/** Romanian labels for issue statuses */
export const ISSUE_STATUS_LABELS_RO: Record<IssueStatus, string> = {
  REPORTED: 'Raportată',
  ASSIGNED: 'Atribuită',
  IN_PROGRESS: 'În lucru',
  RESOLVED: 'Rezolvată',
  VERIFIED: 'Verificată',
  REOPENED: 'Redeschisă',
  CLOSED: 'Închisă',
};

/** Romanian labels for site statuses */
export const SITE_STATUS_LABELS_RO: Record<SiteStatus, string> = {
  ACTIVE: 'Activ',
  PAUSED: 'Suspendat',
  COMPLETED: 'Finalizat',
  CLOSED: 'Închis',
};

/** Romanian labels for employee statuses */
export const EMPLOYEE_STATUS_LABELS_RO: Record<EmployeeStatus, string> = {
  ACTIVE: 'Activ',
  ON_LEAVE: 'Concediu',
  SUSPENDED: 'Suspendat',
  TERMINATED: 'Încetat',
};
