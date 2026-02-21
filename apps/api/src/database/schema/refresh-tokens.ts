import { relations } from 'drizzle-orm';
import {
  bigint,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './users';

export const refreshTokens = pgTable('refresh_tokens', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  deviceInfo: varchar('device_info', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  replacedBy: bigint('replaced_by', { mode: 'number' }).references((): any => refreshTokens.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
  replacedByToken: one(refreshTokens, {
    fields: [refreshTokens.replacedBy],
    references: [refreshTokens.id],
    relationName: 'tokenReplacement',
  }),
}));
