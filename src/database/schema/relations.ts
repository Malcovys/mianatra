import { defineRelations } from "drizzle-orm";
import { appSettings } from "./app-settings.table";
import { conceptProgress } from "./concept-progress.table";
import { concepts } from "./concepts.table";
import { courseAnalyses } from "./course-analyses.table";
import { coursePages } from "./course-pages.table";
import { courses } from "./courses.table";
import { exerciseAttempts } from "./exercise-attempts.table";
import { exercises } from "./exercises.table";
import { recommendations } from "./recommendations.table";
import { revisionSheets } from "./revision-sheets.table";
import { sessionReports } from "./session-reports.table";
import { studySessions } from "./study-sessions.table";
import { subjects } from "./subjects.table";

const schemaTables = {
  appSettings,
  conceptProgress,
  concepts,
  courseAnalyses,
  coursePages,
  courses,
  exerciseAttempts,
  exercises,
  recommendations,
  revisionSheets,
  sessionReports,
  studySessions,
  subjects,
};

export const dbRelations = defineRelations(schemaTables, (r) => ({
  subjects: {
    courses: r.many.courses({ from: r.subjects.id, to: r.courses.subjectId }),
  },
  courses: {
    subject: r.one.subjects({ from: r.courses.subjectId, to: r.subjects.id, optional: false }),
    pages: r.many.coursePages({ from: r.courses.id, to: r.coursePages.courseId }),
    analyses: r.many.courseAnalyses({ from: r.courses.id, to: r.courseAnalyses.courseId }),
    concepts: r.many.concepts({ from: r.courses.id, to: r.concepts.courseId }),
    revisionSheets: r.many.revisionSheets({ from: r.courses.id, to: r.revisionSheets.courseId }),
    exercises: r.many.exercises({ from: r.courses.id, to: r.exercises.courseId }),
    sessions: r.many.studySessions({ from: r.courses.id, to: r.studySessions.courseId }),
    recommendations: r.many.recommendations({ from: r.courses.id, to: r.recommendations.courseId }),
  },
  coursePages: {
    course: r.one.courses({ from: r.coursePages.courseId, to: r.courses.id, optional: false }),
  },
  courseAnalyses: {
    course: r.one.courses({ from: r.courseAnalyses.courseId, to: r.courses.id, optional: false }),
  },
  concepts: {
    course: r.one.courses({ from: r.concepts.courseId, to: r.courses.id, optional: false }),
    progress: r.one.conceptProgress({ from: r.concepts.id, to: r.conceptProgress.conceptId }),
    exercises: r.many.exercises({ from: r.concepts.id, to: r.exercises.conceptId }),
    recommendations: r.many.recommendations({ from: r.concepts.id, to: r.recommendations.conceptId }),
    strongReports: r.many.sessionReports({ from: r.concepts.id, to: r.sessionReports.strongConceptId }),
    weakReports: r.many.sessionReports({ from: r.concepts.id, to: r.sessionReports.weakConceptId }),
  },
  revisionSheets: {
    course: r.one.courses({ from: r.revisionSheets.courseId, to: r.courses.id, optional: false }),
  },
  exercises: {
    course: r.one.courses({ from: r.exercises.courseId, to: r.courses.id, optional: false }),
    concept: r.one.concepts({ from: r.exercises.conceptId, to: r.concepts.id, optional: false }),
    attempts: r.many.exerciseAttempts({ from: r.exercises.id, to: r.exerciseAttempts.exerciseId }),
  },
  studySessions: {
    course: r.one.courses({ from: r.studySessions.courseId, to: r.courses.id, optional: false }),
    attempts: r.many.exerciseAttempts({ from: r.studySessions.id, to: r.exerciseAttempts.sessionId }),
    report: r.one.sessionReports({ from: r.studySessions.id, to: r.sessionReports.sessionId }),
  },
  exerciseAttempts: {
    session: r.one.studySessions({ from: r.exerciseAttempts.sessionId, to: r.studySessions.id, optional: false }),
    exercise: r.one.exercises({ from: r.exerciseAttempts.exerciseId, to: r.exercises.id, optional: false }),
  },
  conceptProgress: {
    concept: r.one.concepts({ from: r.conceptProgress.conceptId, to: r.concepts.id, optional: false }),
  },
  sessionReports: {
    session: r.one.studySessions({ from: r.sessionReports.sessionId, to: r.studySessions.id, optional: false }),
    strongConcept: r.one.concepts({ from: r.sessionReports.strongConceptId, to: r.concepts.id }),
    weakConcept: r.one.concepts({ from: r.sessionReports.weakConceptId, to: r.concepts.id }),
  },
  recommendations: {
    course: r.one.courses({ from: r.recommendations.courseId, to: r.courses.id }),
    concept: r.one.concepts({ from: r.recommendations.conceptId, to: r.concepts.id }),
  },
}));
