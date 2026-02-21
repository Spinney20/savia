import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { companies } from './companies';
import { sites } from './sites';
import { userAgencyAssignments } from './user-agency-assignments';

export const agencies = pgTable('agencies', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid('uuid').notNull().defaultRandom().unique(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  company: one(companies, {
    fields: [agencies.companyId],
    references: [companies.id],
  }),
  sites: many(sites),
  userAgencyAssignments: many(userAgencyAssignments),
}));
