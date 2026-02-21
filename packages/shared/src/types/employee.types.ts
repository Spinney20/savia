/**
 * Employee & document types
 */

export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const DOCUMENT_TYPES = [
  'MEDICAL_RECORD',
  'CERTIFICATE',
  'CONTRACT',
  'ID_DOCUMENT',
  'TRAINING_RECORD',
  'OTHER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface EmployeeDto {
  uuid: string;
  companyUuid: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  jobTitle: string | null;
  hireDate: string | null;
  terminationDate: string | null;
  status: EmployeeStatus;
  hasUserAccount: boolean;
  createdAt: string;
}

export interface EmployeeDocumentDto {
  uuid: string;
  employeeUuid: string;
  documentType: DocumentType;
  title: string;
  description: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

export interface EmployeeSiteAssignmentDto {
  employeeUuid: string;
  siteUuid: string;
  assignedAt: string;
  removedAt: string | null;
  notes: string | null;
}
