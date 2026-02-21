import {
  bigint,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Note: In production this table is partitioned by performed_at.
// The composite PRIMARY KEY (id, performed_at) is handled in migration SQL.
// Drizzle does not support composite PKs with generatedAlwaysAsIdentity,
// so we define id as a simple PK here.
export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 50 }),
  operation: varchar('operation', { length: 10 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: jsonb('changed_fields'),
  performedBy: varchar('performed_by', { length: 50 }),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
});
