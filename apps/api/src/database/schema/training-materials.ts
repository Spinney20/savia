import { relations } from 'drizzle-orm';
import {
  bigint,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { trainings } from './trainings';
import { users } from './users';

export const trainingMaterials = pgTable('training_materials', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  trainingId: bigint('training_id', { mode: 'number' }).notNull().references(() => trainings.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  uploadedBy: bigint('uploaded_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const trainingMaterialsRelations = relations(trainingMaterials, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingMaterials.trainingId],
    references: [trainings.id],
  }),
  uploadedByUser: one(users, {
    fields: [trainingMaterials.uploadedBy],
    references: [users.id],
  }),
}));
