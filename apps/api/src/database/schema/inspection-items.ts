import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  decimal,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { inspections } from './inspections';

export const inspectionItems = pgTable(
  'inspection_items',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    inspectionId: bigint('inspection_id', { mode: 'number' }).notNull().references(() => inspections.id, { onDelete: 'cascade' }),
    sectionId: varchar('section_id', { length: 50 }).notNull(),
    questionId: varchar('question_id', { length: 50 }).notNull(),
    answerType: varchar('answer_type', { length: 20 }).notNull(),
    answerBool: boolean('answer_bool'),
    answerText: text('answer_text'),
    answerNumber: decimal('answer_number', { precision: 10, scale: 2 }),
    isCompliant: boolean('is_compliant'),
    severity: varchar('severity', { length: 10 }),
    riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('inspection_items_answer_type_check', sql`${table.answerType} IN ('YES_NO', 'TEXT', 'NUMBER', 'SELECT', 'PHOTO')`),
    check('inspection_items_severity_check', sql`${table.severity} IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') OR ${table.severity} IS NULL`),
  ],
);

export const inspectionItemsRelations = relations(inspectionItems, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionItems.inspectionId],
    references: [inspections.id],
  }),
}));
