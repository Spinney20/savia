import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export function createDrizzleConnection(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}
