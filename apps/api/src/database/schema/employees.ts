import { relations } from 'drizzle-orm';
import {
  bigint,
  check,
  customType,
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { companies } from './companies';
import { employeeDocuments } from './employee-documents';
import { employeeSiteAssignments } from './employee-site-assignments';
import { users } from './users';

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const employees = pgTable(
  'employees',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    cnpEncrypted: bytea('cnp_encrypted'),
    cnpHash: varchar('cnp_hash', { length: 64 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    jobTitle: varchar('job_title', { length: 150 }),
    hireDate: date('hire_date'),
    terminationDate: date('termination_date'),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    signatureData: jsonb('signature_data'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('employees_status_check', sql`${table.status} IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')`),
  ],
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  documents: many(employeeDocuments),
  siteAssignments: many(employeeSiteAssignments),
  users: many(users),
}));
