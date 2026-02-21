import { relations } from 'drizzle-orm';
import {
  bigint,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { issueReports } from './issue-reports';
import { users } from './users';

export const issueStatusHistory = pgTable('issue_status_history', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  issueId: bigint('issue_id', { mode: 'number' }).notNull().references(() => issueReports.id, { onDelete: 'cascade' }),
  fromStatus: varchar('from_status', { length: 20 }),
  toStatus: varchar('to_status', { length: 20 }).notNull(),
  changedBy: bigint('changed_by', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
  reason: text('reason'),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issueStatusHistoryRelations = relations(issueStatusHistory, ({ one }) => ({
  issue: one(issueReports, {
    fields: [issueStatusHistory.issueId],
    references: [issueReports.id],
  }),
  changedByUser: one(users, {
    fields: [issueStatusHistory.changedBy],
    references: [users.id],
  }),
}));
