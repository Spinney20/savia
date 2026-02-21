import { relations } from 'drizzle-orm';
import {
  bigint,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { companies } from './companies';
import { users } from './users';

export const appSettings = pgTable('app_settings', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  companyId: bigint('company_id', { mode: 'number' }).references(() => companies.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  company: one(companies, {
    fields: [appSettings.companyId],
    references: [companies.id],
  }),
  updatedByUser: one(users, {
    fields: [appSettings.updatedBy],
    references: [users.id],
  }),
}));
