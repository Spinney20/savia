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
import { sites } from './sites';
import { trainingMaterials } from './training-materials';
import { trainingParticipants } from './training-participants';
import { users } from './users';

export const trainings = pgTable(
  'trainings',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    siteId: bigint('site_id', { mode: 'number' }).notNull().references(() => sites.id, { onDelete: 'restrict' }),
    conductorId: bigint('conductor_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    trainingType: varchar('training_type', { length: 30 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    conductedAt: timestamp('conducted_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes'),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    pdfUrl: varchar('pdf_url', { length: 500 }),
    pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
    signatureData: jsonb('signature_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('trainings_training_type_check', sql`${table.trainingType} IN ('ANGAJARE', 'PERIODIC', 'SCHIMBARE_LOC_MUNCA', 'REVENIRE_MEDICAL', 'SPECIAL', 'ZILNIC')`),
  ],
);

export const trainingsRelations = relations(trainings, ({ one, many }) => ({
  company: one(companies, {
    fields: [trainings.companyId],
    references: [companies.id],
  }),
  site: one(sites, {
    fields: [trainings.siteId],
    references: [sites.id],
  }),
  conductor: one(users, {
    fields: [trainings.conductorId],
    references: [users.id],
  }),
  participants: many(trainingParticipants),
  materials: many(trainingMaterials),
}));
