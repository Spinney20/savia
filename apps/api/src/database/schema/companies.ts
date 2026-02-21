import { relations } from 'drizzle-orm';
import {
  bigint,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { agencies } from './agencies';
import { employees } from './employees';
import { employeeDocuments } from './employee-documents';
import { sites } from './sites';
import { users } from './users';

export const companies = pgTable('companies', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid('uuid').notNull().defaultRandom().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  cui: varchar('cui', { length: 20 }),
  regCom: varchar('reg_com', { length: 30 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  agencies: many(agencies),
  employees: many(employees),
  employeeDocuments: many(employeeDocuments),
  sites: many(sites),
  users: many(users),
}));
