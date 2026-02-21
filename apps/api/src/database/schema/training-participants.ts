import { relations } from 'drizzle-orm';
import {
  bigint,
  check,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { employees } from './employees';
import { trainings } from './trainings';

export const trainingParticipants = pgTable(
  'training_participants',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    trainingId: bigint('training_id', { mode: 'number' }).notNull().references(() => trainings.id, { onDelete: 'cascade' }),
    employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'restrict' }),
    confirmationMethod: varchar('confirmation_method', { length: 20 }).notNull().default('PENDING'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    signatureData: jsonb('signature_data'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('training_participants_confirmation_method_check', sql`${table.confirmationMethod} IN ('PENDING', 'MANUAL', 'SELF_CONFIRMED', 'ABSENT')`),
  ],
);

export const trainingParticipantsRelations = relations(trainingParticipants, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingParticipants.trainingId],
    references: [trainings.id],
  }),
  employee: one(employees, {
    fields: [trainingParticipants.employeeId],
    references: [employees.id],
  }),
}));
