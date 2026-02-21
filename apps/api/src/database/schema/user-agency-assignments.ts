import { relations } from 'drizzle-orm';
import {
  bigint,
  pgTable,
  timestamp,
} from 'drizzle-orm/pg-core';

import { agencies } from './agencies';
import { users } from './users';

export const userAgencyAssignments = pgTable('user_agency_assignments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  agencyId: bigint('agency_id', { mode: 'number' }).notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
  assignedBy: bigint('assigned_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const userAgencyAssignmentsRelations = relations(userAgencyAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userAgencyAssignments.userId],
    references: [users.id],
    relationName: 'assignedUser',
  }),
  agency: one(agencies, {
    fields: [userAgencyAssignments.agencyId],
    references: [agencies.id],
  }),
  assignedByUser: one(users, {
    fields: [userAgencyAssignments.assignedBy],
    references: [users.id],
    relationName: 'assignedByUser',
  }),
}));
