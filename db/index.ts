// /db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not defined. Database operations will fail.');
}

// Pass a dummy URL if missing to prevent 'neon' from throwing synchronously on import.
// This ensures the server starts, and errors only happen when queries are actually run.
const sql = neon(databaseUrl || 'postgresql://dummy:dummy@localhost/dummy');
export const db = drizzle(sql, { schema });

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
