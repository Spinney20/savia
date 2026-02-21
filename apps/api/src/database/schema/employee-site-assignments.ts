import { relations } from 'drizzle-orm';
import {
  bigint,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { employees } from './employees';
import { sites } from './sites';
import { users } from './users';

export const employeeSiteAssignments = pgTable('employee_site_assignments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  siteId: bigint('site_id', { mode: 'number' }).notNull().references(() => sites.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
  assignedBy: bigint('assigned_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const employeeSiteAssignmentsRelations = relations(employeeSiteAssignments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeSiteAssignments.employeeId],
    references: [employees.id],
  }),
  site: one(sites, {
    fields: [employeeSiteAssignments.siteId],
    references: [sites.id],
  }),
  user: one(users, {
    fields: [employeeSiteAssignments.userId],
    references: [users.id],
    relationName: 'assignedUserAccount',
  }),
  assignedByUser: one(users, {
    fields: [employeeSiteAssignments.assignedBy],
    references: [users.id],
    relationName: 'assignedByUser',
  }),
}));
