import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { companies } from './companies';
import { users } from './users';

export const inspectionTemplates = pgTable('inspection_templates', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid('uuid').notNull().defaultRandom().unique(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  currentVersionId: bigint('current_version_id', { mode: 'number' }),
  versionCount: integer('version_count').notNull().default(0),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const inspectionTemplateVersions = pgTable('inspection_template_versions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  templateId: bigint('template_id', { mode: 'number' }).notNull().references(() => inspectionTemplates.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  structure: jsonb('structure').notNull(),
  changeNotes: text('change_notes'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: bigint('published_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const inspectionTemplatesRelations = relations(inspectionTemplates, ({ one, many }) => ({
  company: one(companies, {
    fields: [inspectionTemplates.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [inspectionTemplates.createdBy],
    references: [users.id],
  }),
  currentVersion: one(inspectionTemplateVersions, {
    fields: [inspectionTemplates.currentVersionId],
    references: [inspectionTemplateVersions.id],
  }),
  versions: many(inspectionTemplateVersions),
}));

export const inspectionTemplateVersionsRelations = relations(inspectionTemplateVersions, ({ one }) => ({
  template: one(inspectionTemplates, {
    fields: [inspectionTemplateVersions.templateId],
    references: [inspectionTemplates.id],
  }),
  publishedByUser: one(users, {
    fields: [inspectionTemplateVersions.publishedBy],
    references: [users.id],
  }),
}));
