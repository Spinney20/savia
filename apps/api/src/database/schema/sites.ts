import { relations } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { agencies } from './agencies';
import { companies } from './companies';
import { employeeSiteAssignments } from './employee-site-assignments';

export const sites = pgTable(
  'sites',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    agencyId: bigint('agency_id', { mode: 'number' }).notNull().references(() => agencies.id, { onDelete: 'restrict' }),
    companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 30 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    county: varchar('county', { length: 50 }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    geofenceRadius: integer('geofence_radius').default(200),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    startDate: date('start_date'),
    estimatedEnd: date('estimated_end'),
    actualEnd: date('actual_end'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('sites_status_check', sql`${table.status} IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CLOSED')`),
  ],
);

export const sitesRelations = relations(sites, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [sites.agencyId],
    references: [agencies.id],
  }),
  company: one(companies, {
    fields: [sites.companyId],
    references: [companies.id],
  }),
  employeeSiteAssignments: many(employeeSiteAssignments),
}));
