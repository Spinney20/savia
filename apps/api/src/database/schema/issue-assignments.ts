import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { issueReports } from './issue-reports';
import { users } from './users';

export const issueAssignments = pgTable('issue_assignments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  issueId: bigint('issue_id', { mode: 'number' }).notNull().references(() => issueReports.id, { onDelete: 'cascade' }),
  assignedTo: bigint('assigned_to', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
  assignedBy: bigint('assigned_by', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
  deadline: timestamp('deadline', { withTimezone: true }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issueAssignmentsRelations = relations(issueAssignments, ({ one }) => ({
  issue: one(issueReports, {
    fields: [issueAssignments.issueId],
    references: [issueReports.id],
  }),
  assignedToUser: one(users, {
    fields: [issueAssignments.assignedTo],
    references: [users.id],
    relationName: 'assignedToUser',
  }),
  assignedByUser: one(users, {
    fields: [issueAssignments.assignedBy],
    references: [users.id],
    relationName: 'assignedByUser',
  }),
}));
