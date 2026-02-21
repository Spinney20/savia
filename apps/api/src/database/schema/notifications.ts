import { relations } from 'drizzle-orm';
import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { companies } from './companies';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid('uuid').notNull().defaultRandom().unique(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.id, { onDelete: 'restrict' }),
  recipientId: bigint('recipient_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  notificationType: varchar('notification_type', { length: 30 }).notNull(),
  channel: varchar('channel', { length: 10 }).notNull(),
  pushStatus: varchar('push_status', { length: 10 }).default('PENDING'),
  emailStatus: varchar('email_status', { length: 10 }).default('PENDING'),
  readAt: timestamp('read_at', { withTimezone: true }),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: bigint('reference_id', { mode: 'number' }),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id],
  }),
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));
