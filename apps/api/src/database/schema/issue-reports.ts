import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { companies } from './companies';
import { issueAssignments } from './issue-assignments';
import { issueCategories } from './issue-categories';
import { issueComments } from './issue-comments';
import { issueStatusHistory } from './issue-status-history';
import { sites } from './sites';
import { users } from './users';

export const issueReports = pgTable(
  'issue_reports',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    siteId: bigint('site_id', { mode: 'number' }).notNull().references(() => sites.id, { onDelete: 'restrict' }),
    categoryId: bigint('category_id', { mode: 'number' }).references(() => issueCategories.id, { onDelete: 'set null' }),
    reportedBy: bigint('reported_by', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    severity: varchar('severity', { length: 10 }).notNull().default('MEDIUM'),
    status: varchar('status', { length: 20 }).notNull().default('REPORTED'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    deadline: timestamp('deadline', { withTimezone: true }),
    deadlineNotified: boolean('deadline_notified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('issue_reports_severity_check', sql`${table.severity} IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`),
    check('issue_reports_status_check', sql`${table.status} IN ('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'REOPENED', 'CLOSED')`),
  ],
);

export const issueReportsRelations = relations(issueReports, ({ one, many }) => ({
  company: one(companies, {
    fields: [issueReports.companyId],
    references: [companies.id],
  }),
  site: one(sites, {
    fields: [issueReports.siteId],
    references: [sites.id],
  }),
  category: one(issueCategories, {
    fields: [issueReports.categoryId],
    references: [issueCategories.id],
  }),
  reporter: one(users, {
    fields: [issueReports.reportedBy],
    references: [users.id],
  }),
  assignments: many(issueAssignments),
  comments: many(issueComments),
  statusHistory: many(issueStatusHistory),
}));
