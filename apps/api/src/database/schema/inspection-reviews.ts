import { relations } from 'drizzle-orm';
import {
  bigint,
  check,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { inspections } from './inspections';
import { users } from './users';

export const inspectionReviews = pgTable(
  'inspection_reviews',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    inspectionId: bigint('inspection_id', { mode: 'number' }).notNull().references(() => inspections.id, { onDelete: 'cascade' }),
    reviewerId: bigint('reviewer_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    decision: varchar('decision', { length: 20 }).notNull(),
    reason: text('reason'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('inspection_reviews_decision_check', sql`${table.decision} IN ('APPROVED', 'REJECTED', 'NEEDS_REVISION')`),
  ],
);

export const inspectionReviewsRelations = relations(inspectionReviews, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionReviews.inspectionId],
    references: [inspections.id],
  }),
  reviewer: one(users, {
    fields: [inspectionReviews.reviewerId],
    references: [users.id],
  }),
}));
