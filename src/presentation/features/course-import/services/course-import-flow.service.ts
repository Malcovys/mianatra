import type { Subject } from "@/src/db";

export type CourseImportSubjectSelection = {
  subjectName: string;
  selectedSubjectId: string | null;
};

export function normalizeCourseImportSubjectName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizedKey(value: string) {
  return normalizeCourseImportSubjectName(value).toLocaleLowerCase();
}

export function findCourseImportSubjectByNormalizedName(subjects: readonly Subject[], subjectName: string) {
  const key = normalizedKey(subjectName);
  if (!key) {
    return null;
  }
  return subjects.find((subject) => normalizedKey(subject.name) === key) ?? null;
}

export function resolveInitialCourseImportSubject(input: {
  requestedSubjectId?: string | null;
  subjects: readonly Subject[];
  defaultSubjectName: string;
}): CourseImportSubjectSelection {
  const requestedSubject = input.requestedSubjectId
    ? input.subjects.find((subject) => subject.id === input.requestedSubjectId)
    : null;
  if (requestedSubject) {
    return {
      subjectName: requestedSubject.name,
      selectedSubjectId: requestedSubject.id,
    };
  }

  const defaultSubject = findCourseImportSubjectByNormalizedName(input.subjects, input.defaultSubjectName);
  return {
    subjectName: defaultSubject?.name ?? input.defaultSubjectName,
    selectedSubjectId: defaultSubject?.id ?? null,
  };
}

export async function resolveCourseImportSubjectForCreation(input: {
  subjectName: string;
  selectedSubjectId: string | null;
  subjects: readonly Subject[];
  getOrCreateSubject: (name: string) => Promise<Subject>;
}) {
  const normalizedSubjectName = normalizeCourseImportSubjectName(input.subjectName);
  if (!normalizedSubjectName) {
    throw new Error("COURSE_IMPORT_SUBJECT_NAME_EMPTY");
  }

  const selectedSubject = input.selectedSubjectId
    ? input.subjects.find((subject) => subject.id === input.selectedSubjectId)
    : null;
  if (selectedSubject && normalizedKey(selectedSubject.name) === normalizedKey(normalizedSubjectName)) {
    return selectedSubject;
  }

  const existingSubject = findCourseImportSubjectByNormalizedName(input.subjects, normalizedSubjectName);
  if (existingSubject) {
    return existingSubject;
  }

  return input.getOrCreateSubject(normalizedSubjectName);
}

export function shouldReuseCompiledCourse(courseId: string | null) {
  return Boolean(courseId);
}
