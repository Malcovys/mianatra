export type CourseListItem = {
  id: string;
  title: string;
  subject: string;
  subjectColor: string | null;
  iconName: string | null;
  grade: string;
  pageCount: number;
  progress: number;
  masteredCount: number;
  progressingCount: number;
  needsWorkCount: number;
  notStartedCount: number;
  status: "draft" | "processing" | "ready";
  lastReviewedAt: string | null;
  updatedAt: string;
};
