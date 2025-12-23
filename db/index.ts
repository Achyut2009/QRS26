// /db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export type User = typeof schema.users.$inferSelect;
export type Quiz = typeof schema.quizzes.$inferSelect;
export type Question = typeof schema.questions.$inferSelect;
export type Attempt = typeof schema.attempts.$inferSelect;
export type NewQuiz = typeof schema.quizzes.$inferInsert;
export type NewQuestion = typeof schema.questions.$inferInsert;
export type NewAttempt = typeof schema.attempts.$inferInsert;