import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { companies } from './companies';
import { employees } from './employees';
import { userAgencyAssignments } from './user-agency-assignments';

export const users = pgTable(
  'users',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'restrict' }),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 30 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    pushToken: varchar('push_token', { length: 500 }),
    preferences: jsonb('preferences').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('users_role_check', sql`${table.role} IN ('ADMIN', 'MANAGER_SSM', 'SEF_AGENTIE', 'INSPECTOR_SSM', 'SEF_SANTIER', 'MUNCITOR')`),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  agencyAssignments: many(userAgencyAssignments),
}));
