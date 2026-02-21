import { relations } from 'drizzle-orm';
import {
  bigint,
  check,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { companies } from './companies';
import { inspectionTemplateVersions } from './inspection-templates';
import { inspectionItems } from './inspection-items';
import { inspectionReviews } from './inspection-reviews';
import { sites } from './sites';
import { users } from './users';

export const inspections = pgTable(
  'inspections',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    siteId: bigint('site_id', { mode: 'number' }).notNull().references(() => sites.id, { onDelete: 'restrict' }),
    templateVersionId: bigint('template_version_id', { mode: 'number' }).notNull().references(() => inspectionTemplateVersions.id, { onDelete: 'restrict' }),
    inspectorId: bigint('inspector_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
    totalItems: integer('total_items').notNull().default(0),
    compliantItems: integer('compliant_items').notNull().default(0),
    nonCompliantItems: integer('non_compliant_items').notNull().default(0),
    notes: text('notes'),
    pdfUrl: varchar('pdf_url', { length: 500 }),
    pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
    signatureData: jsonb('signature_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('inspections_status_check', sql`${table.status} IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'NEEDS_REVISION', 'CLOSED')`),
  ],
);

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  company: one(companies, {
    fields: [inspections.companyId],
    references: [companies.id],
  }),
  site: one(sites, {
    fields: [inspections.siteId],
    references: [sites.id],
  }),
  templateVersion: one(inspectionTemplateVersions, {
    fields: [inspections.templateVersionId],
    references: [inspectionTemplateVersions.id],
  }),
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
  }),
  items: many(inspectionItems),
  reviews: many(inspectionReviews),
}));
