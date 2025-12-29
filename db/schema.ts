// /db/schema.ts
import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const quizStatusEnum = pgEnum('quiz_status', ['draft', 'published', 'archived']);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  clerkUserId: text("clerk_user_id").unique(), // Store Clerk user ID
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => users.email),
  status: quizStatusEnum("status").default('draft').notNull(),
  duration: integer("duration"), // in minutes, null means no time limit
  totalQuestions: integer("total_questions").notNull().default(0),
  passingScore: integer("passing_score").default(70), // percentage
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  type: text("type").notNull().default('multiple-choice'), // multiple-choice, true-false, etc.
  options: jsonb("options").notNull(), // array of options
  correctAnswer: integer("correct_answer").notNull(), // index of correct answer
  points: integer("points").default(1),
  explanation: text("explanation"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// User quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id),
  userId: text("user_id").notNull().references(() => users.id),
  score: integer("score").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  percentage: integer("percentage").notNull().default(0),
  status: text("status").notNull().default('in-progress'), // in-progress, completed, abandoned
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  timeTaken: integer("time_taken"), // in seconds
  userAnswers: jsonb("user_answers"), // store user's answers
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
  questions: many(questions),
  attempts: many(quizAttempts),
  creator: one(users, {
    fields: [quizzes.createdBy],
    references: [users.email],
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
}));