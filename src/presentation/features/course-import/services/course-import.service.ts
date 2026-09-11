import {
  coursesRepository,
  pagesRepository,
  subjectsRepository,
  type Course,
  type CoursePage,
  type CourseStatus,
  type CreateCourseWithPagesInput,
  type CreatePageInput,
  type PageQualityStatus,
  type Subject,
} from "@/src/database";
import { CourseHasNoPagesError, CourseNotFoundError, SubjectNotFoundError } from "@/src/presentation/features/shared";

export type ImportPageInput = {
  localUri: string;
  thumbnailUri?: string | null;
  rotation?: number;
  qualityStatus?: PageQualityStatus;
};

export type CourseFromPagesInput = {
  subjectId: string;
  title: string;
  grade: string;
  summary?: string | null;
  pages: ImportPageInput[];
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeRotation(rotation = 0) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizePage(page: ImportPageInput): CreatePageInput {
  const localUri = page.localUri.trim();
  if (!localUri) {
    throw new Error("localUri is required.");
  }
  return {
    localUri,
    thumbnailUri: page.thumbnailUri?.trim() || null,
    rotation: normalizeRotation(page.rotation),
    qualityStatus: page.qualityStatus ?? "good",
  };
}

function assertContinuousPages(pages: { pageIndex: number }[]) {
  const indexes = pages.map((page) => page.pageIndex);
  const uniqueIndexes = new Set(indexes);
  if (uniqueIndexes.size !== indexes.length) {
    throw new Error("Course page indexes must not contain duplicates.");
  }
  indexes
    .slice()
    .sort((left, right) => left - right)
    .forEach((pageIndex, expectedIndex) => {
      if (pageIndex !== expectedIndex) {
        throw new Error("Course page indexes must be continuous from zero.");
      }
    });
}

type CourseImportServiceDeps = {
  courses: {
    findById: (id: string) => Promise<Course | null>;
    createWithPages: (input: CreateCourseWithPagesInput) => Promise<{ course: Course; pages: CoursePage[] }>;
    update: (id: string, input: { pageCount?: number; status?: CourseStatus }) => Promise<Course>;
  };
  pages: {
    findAllByCourse: (courseId: string) => Promise<CoursePage[]>;
    createMany: (courseId: string, pages: CreatePageInput[]) => Promise<CoursePage[]>;
    replaceOrder: (courseId: string, orderedPageIds: string[]) => Promise<CoursePage[]>;
    updateRotation: (id: string, rotation: number) => Promise<CoursePage>;
    updateQualityStatus: (id: string, status: PageQualityStatus) => Promise<CoursePage>;
    remove: (id: string) => Promise<void>;
  };
  subjects: {
    findById: (id: string) => Promise<Subject | null>;
  };
};

function createCourseImportService(deps: CourseImportServiceDeps) {
  async function assertCourseExists(courseId: string) {
    const course = await deps.courses.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError();
    }
    return course;
  }

  return {
    createCourseFromPages: async (input: CourseFromPagesInput) => {
      const subject = await deps.subjects.findById(input.subjectId);
      if (!subject) {
        throw new SubjectNotFoundError();
      }
      const courseInput: CreateCourseWithPagesInput = {
        subjectId: input.subjectId,
        title: normalizeText(input.title),
        grade: normalizeText(input.grade),
        status: "draft" satisfies CourseStatus,
        summary: input.summary?.trim() || null,
        lastReviewedAt: null,
        pages: input.pages.map(normalizePage),
      };
      return deps.courses.createWithPages(courseInput);
    },
    addPages: async (courseId: string, pages: ImportPageInput[]) => {
      await assertCourseExists(courseId);
      return deps.pages.createMany(courseId, pages.map(normalizePage));
    },
    removePage: async (courseId: string, pageId: string) => {
      await assertCourseExists(courseId);
      const pages = await deps.pages.findAllByCourse(courseId);
      if (!pages.some((page) => page.id === pageId)) {
        throw new CourseNotFoundError();
      }
      await deps.pages.remove(pageId);
      const remaining = await deps.pages.findAllByCourse(courseId);
      assertContinuousPages(remaining);
      return remaining;
    },
    reorderPages: async (courseId: string, orderedPageIds: string[]) => {
      await assertCourseExists(courseId);
      const reordered = await deps.pages.replaceOrder(courseId, orderedPageIds);
      assertContinuousPages(reordered);
      return reordered;
    },
    rotatePage: (pageId: string, rotation: number) => deps.pages.updateRotation(pageId, normalizeRotation(rotation)),
    markPageQuality: (pageId: string, qualityStatus: PageQualityStatus) => deps.pages.updateQualityStatus(pageId, qualityStatus),
    compileCourse: async (courseId: string) => {
      const course = await assertCourseExists(courseId);
      const pages = await deps.pages.findAllByCourse(courseId);
      if (pages.length === 0) {
        throw new CourseHasNoPagesError();
      }
      assertContinuousPages(pages);
      const updatedCourse = await deps.courses.update(course.id, { pageCount: pages.length, status: "processing" });
      return {
        course: updatedCourse,
        pages,
        pageCount: pages.length,
        nextStatus: "processing" as const,
      };
    },
  };
}

const courseImportService = createCourseImportService({
  courses: coursesRepository,
  pages: pagesRepository,
  subjects: subjectsRepository,
});

export async function getCourseImportDefaults() {
  const subjects = await subjectsRepository.findAll();
  return {
    subject: subjects[0] ?? null,
    subjectName: subjects[0]?.name ?? "SVT",
    title: "Nouveau cours",
    grade: "2nde",
  };
}

export async function getOrCreateCourseImportSubject(name: string) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    throw new SubjectNotFoundError();
  }

  const existingSubject = await subjectsRepository.findByName(normalizedName);
  if (existingSubject) {
    return existingSubject;
  }

  try {
    return await subjectsRepository.create({
      name: normalizedName,
      icon: "book",
      color: "#D94B24",
      isDefault: false,
    });
  } catch {
    const subject = await subjectsRepository.findByName(normalizedName);
    if (subject) {
      return subject;
    }
    throw new SubjectNotFoundError();
  }
}

export async function createCourseFromPages(input: CourseFromPagesInput) {
  return courseImportService.createCourseFromPages(input);
}

export async function addPages(courseId: string, pages: ImportPageInput[]) {
  return courseImportService.addPages(courseId, pages);
}

export async function removePage(courseId: string, pageId: string) {
  return courseImportService.removePage(courseId, pageId);
}

export async function reorderPages(courseId: string, orderedPageIds: string[]) {
  return courseImportService.reorderPages(courseId, orderedPageIds);
}

export async function rotatePage(pageId: string, rotation: number) {
  return courseImportService.rotatePage(pageId, rotation);
}

export async function markPageQuality(pageId: string, qualityStatus: PageQualityStatus) {
  return courseImportService.markPageQuality(pageId, qualityStatus);
}

export async function compileCourse(courseId: string) {
  return courseImportService.compileCourse(courseId);
}
