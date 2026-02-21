import { z } from 'zod';
import { EMPLOYEE_STATUSES, DOCUMENT_TYPES } from '../types/employee.types.js';
import { ROLES } from '../types/user.types.js';

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  cnp: z.string().length(13).regex(/^\d{13}$/).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  jobTitle: z.string().max(150).nullable().optional(),
  hireDate: z.string().date().nullable().optional(),
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial().extend({
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  terminationDate: z.string().date().nullable().optional(),
});
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const CreateEmployeeDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  issuedDate: z.string().date().nullable().optional(),
  expiryDate: z.string().date().nullable().optional(),
});
export type CreateEmployeeDocumentInput = z.infer<typeof CreateEmployeeDocumentSchema>;

export const CreateUserForEmployeeSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(ROLES),
});
export type CreateUserForEmployeeInput = z.infer<typeof CreateUserForEmployeeSchema>;

export const AssignEmployeeToSiteSchema = z.object({
  siteUuid: z.string().uuid(),
  notes: z.string().nullable().optional(),
});
export type AssignEmployeeToSiteInput = z.infer<typeof AssignEmployeeToSiteSchema>;
