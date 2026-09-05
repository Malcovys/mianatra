import type * as schema from "./schema";

export type CourseStatus = "draft" | "processing" | "ready" | "archived";
export type PageQualityStatus = "good" | "blurry" | "unreadable";
export type ExerciseType =
  | "multiple_choice"
  | "short_answer"
  | "true_false"
  | "numeric"
  | "explanation"
  | "graph_reading";
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type StudySessionType = "initial" | "targeted" | "retry";
export type StudySessionStatus = "active" | "completed" | "abandoned";
export type ConceptProgressStatus =
  | "not_started"
  | "to_discover"
  | "in_progress"
  | "needs_reinforcement"
  | "mastered";
export type RecommendationType = "resume" | "targeted" | "new_course";

export function ensureDifficulty(value: number): Difficulty {
  if (value < 1 || value > 5 || !Number.isInteger(value)) {
    throw new Error("Difficulty must be an integer between 1 and 5.");
  }

  return value as Difficulty;
}

export type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type Subject = typeof schema.subjects.$inferSelect;
export type NewSubject = typeof schema.subjects.$inferInsert;
export type Course = typeof schema.courses.$inferSelect;
export type NewCourse = typeof schema.courses.$inferInsert;
export type CoursePage = typeof schema.coursePages.$inferSelect;
export type NewCoursePage = typeof schema.coursePages.$inferInsert;
export type CourseAnalysis = typeof schema.courseAnalyses.$inferSelect;
export type NewCourseAnalysis = typeof schema.courseAnalyses.$inferInsert;
export type Concept = typeof schema.concepts.$inferSelect;
export type NewConcept = typeof schema.concepts.$inferInsert;
export type RevisionSheet = typeof schema.revisionSheets.$inferSelect;
export type NewRevisionSheet = typeof schema.revisionSheets.$inferInsert;
export type Exercise = typeof schema.exercises.$inferSelect;
export type NewExercise = typeof schema.exercises.$inferInsert;
export type StudySession = typeof schema.studySessions.$inferSelect;
export type NewStudySession = typeof schema.studySessions.$inferInsert;
export type ExerciseAttempt = typeof schema.exerciseAttempts.$inferSelect;
export type NewExerciseAttempt = typeof schema.exerciseAttempts.$inferInsert;
export type ConceptProgress = typeof schema.conceptProgress.$inferSelect;
export type NewConceptProgress = typeof schema.conceptProgress.$inferInsert;
export type SessionReport = typeof schema.sessionReports.$inferSelect;
export type NewSessionReport = typeof schema.sessionReports.$inferInsert;
export type Recommendation = typeof schema.recommendations.$inferSelect;
export type NewRecommendation = typeof schema.recommendations.$inferInsert;
export type AppSetting = typeof schema.appSettings.$inferSelect;
export type NewAppSetting = typeof schema.appSettings.$inferInsert;
