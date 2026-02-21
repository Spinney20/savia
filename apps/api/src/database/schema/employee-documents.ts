import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { companies } from './companies';
import { employees } from './employees';
import { users } from './users';

export const employeeDocuments = pgTable(
  'employee_documents',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    documentType: varchar('document_type', { length: 30 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    issuedDate: date('issued_date'),
    expiryDate: date('expiry_date'),
    expiryNotified: boolean('expiry_notified').notNull().default(false),
    uploadedBy: bigint('uploaded_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('employee_documents_type_check', sql`${table.documentType} IN ('MEDICAL_RECORD', 'CERTIFICATE', 'CONTRACT', 'ID_DOCUMENT', 'TRAINING_RECORD', 'OTHER')`),
  ],
);

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [employeeDocuments.companyId],
    references: [companies.id],
  }),
  uploadedByUser: one(users, {
    fields: [employeeDocuments.uploadedBy],
    references: [users.id],
  }),
}));
