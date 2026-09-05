export type HomeDashboardSubject = {
  id: string;
  name: string;
  color: string | null;
  iconName: string | null;
  chapterCount: number;
  progress: number;
  mainWeakness: string | null;
  updatedAt: string;
};

export type HomeDashboardActiveSession = {
  id: string;
  courseId: string;
  courseTitle: string;
  currentExerciseIndex: number;
  totalExercises: number;
};

export type HomeDashboard = {
  recentSubjects: HomeDashboardSubject[];
  activeSession: HomeDashboardActiveSession | null;
};
