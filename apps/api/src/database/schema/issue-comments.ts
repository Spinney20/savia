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

export const issueComments = pgTable('issue_comments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  issueId: bigint('issue_id', { mode: 'number' }).notNull().references(() => issueReports.id, { onDelete: 'cascade' }),
  authorId: bigint('author_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
  content: text('content').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const issueCommentsRelations = relations(issueComments, ({ one }) => ({
  issue: one(issueReports, {
    fields: [issueComments.issueId],
    references: [issueReports.id],
  }),
  author: one(users, {
    fields: [issueComments.authorId],
    references: [users.id],
  }),
}));
