import { relations } from 'drizzle-orm';
import {
  bigint,
  check,
  decimal,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { companies } from './companies';
import { employeeDocuments } from './employee-documents';
import { inspectionItems } from './inspection-items';
import { inspections } from './inspections';
import { issueComments } from './issue-comments';
import { issueReports } from './issue-reports';
import { trainingMaterials } from './training-materials';
import { trainings } from './trainings';
import { users } from './users';

export const attachments = pgTable(
  'attachments',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    inspectionId: bigint('inspection_id', { mode: 'number' }).references(() => inspections.id, { onDelete: 'cascade' }),
    inspectionItemId: bigint('inspection_item_id', { mode: 'number' }).references(() => inspectionItems.id, { onDelete: 'cascade' }),
    trainingId: bigint('training_id', { mode: 'number' }).references(() => trainings.id, { onDelete: 'cascade' }),
    trainingMaterialId: bigint('training_material_id', { mode: 'number' }).references(() => trainingMaterials.id, { onDelete: 'cascade' }),
    issueReportId: bigint('issue_report_id', { mode: 'number' }).references(() => issueReports.id, { onDelete: 'cascade' }),
    issueCommentId: bigint('issue_comment_id', { mode: 'number' }).references(() => issueComments.id, { onDelete: 'cascade' }),
    employeeDocumentId: bigint('employee_document_id', { mode: 'number' }).references(() => employeeDocuments.id, { onDelete: 'cascade' }),
    fileUrl: varchar('file_url', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    width: integer('width'),
    height: integer('height'),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    uploadedBy: bigint('uploaded_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    capturedAt: timestamp('captured_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'attachments_exclusive_arc_check',
      sql`(
        (CASE WHEN ${table.inspectionId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${table.inspectionItemId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${table.trainingId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${table.trainingMaterialId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${table.issueReportId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${table.issueCommentId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${table.employeeDocumentId} IS NOT NULL THEN 1 ELSE 0 END)
      ) = 1`,
    ),
  ],
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  company: one(companies, {
    fields: [attachments.companyId],
    references: [companies.id],
  }),
  inspection: one(inspections, {
    fields: [attachments.inspectionId],
    references: [inspections.id],
  }),
  inspectionItem: one(inspectionItems, {
    fields: [attachments.inspectionItemId],
    references: [inspectionItems.id],
  }),
  training: one(trainings, {
    fields: [attachments.trainingId],
    references: [trainings.id],
  }),
  trainingMaterial: one(trainingMaterials, {
    fields: [attachments.trainingMaterialId],
    references: [trainingMaterials.id],
  }),
  issueReport: one(issueReports, {
    fields: [attachments.issueReportId],
    references: [issueReports.id],
  }),
  issueComment: one(issueComments, {
    fields: [attachments.issueCommentId],
    references: [issueComments.id],
  }),
  employeeDocument: one(employeeDocuments, {
    fields: [attachments.employeeDocumentId],
    references: [employeeDocuments.id],
  }),
  uploadedByUser: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));
