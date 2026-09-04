import type { CourseListItem } from "@/src/features/courses";

export type SubjectOverviewItem = {
  id: string;
  name: string;
  color: string | null;
  iconName: string | null;
  chapterCount: number;
  progress: number;
  masteredCount: number;
  progressingCount: number;
  needsWorkCount: number;
  notStartedCount: number;
  mainWeakness: string | null;
  lastReviewedAt: string | null;
  updatedAt: string;
  grades: string[];
};

export type SubjectDetailView = {
  subject: SubjectOverviewItem;
  chapters: CourseListItem[];
};
