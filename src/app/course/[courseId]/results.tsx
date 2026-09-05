import { AppButton, AppCard, AppScreen, AppText, ProgressBar } from "@/src/presentation/components/shared";
import { loadRealCourseResults, type RealCourseResultsState } from "@/src/presentation/features/courses";
import { CourseProgressRing, CourseTopBar } from "@/src/presentation/features/courses/components";
import { CourseResultSummary, RecentActivityList } from "@/src/presentation/features/progress/components";
import { fonts } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CourseResultsScreen() {
  const insets = useSafeAreaInsets();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const resolvedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const [realState, setRealState] = useState<RealCourseResultsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!resolvedCourseId) {
      setRealState(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadRealCourseResults(resolvedCourseId)
      .then((state) => {
        if (!cancelled) {
          setRealState(state);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedCourseId]);

  const realResults = realState?.status === "ready" ? realState.results : null;
  const title = realState?.status === "ready" ? realState.courseTitle : undefined;
  const results = realResults;

  if (isLoading) {
    return (
      <AppScreen contentClassName="gap-5 pb-8">
        <CourseTopBar title="Mes résultats" />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Chargement des résultats</AppText>
          <AppText tone="secondary">Lecture des données SQLite...</AppText>
        </AppCard>
      </AppScreen>
    );
  }

  if (!results || !title) {
    return (
      <AppScreen contentClassName="gap-5 pb-8">
        <CourseTopBar title="Mes résultats" />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Résultats indisponibles</AppText>
          <AppText tone="secondary">
            {realState?.status === "missing"
              ? "Aucun cours SQLite ne correspond à cet identifiant."
              : "Aucun résultat n'est encore disponible pour ce cours."}
          </AppText>
          <AppButton
            title="Retour aux cours"
            iconName="arrow-left"
            onPress={() => router.replace("/courses")}
          />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      contentClassName="gap-4 pt-2"
      contentStyle={{ paddingBottom: Math.max(insets.bottom + 28, 58) }}
    >
      <CourseTopBar title="Mes résultats" />
      <View className="gap-2">
        <AppText
          variant="heading"
          className="text-[25px] leading-[31px] text-[#2F241F]"
          style={{ fontFamily: fonts.bold }}
        >
          Bilan du chapitre
        </AppText>
        <AppText tone="secondary" className="text-[15px] leading-5" style={{ fontFamily: fonts.semibold }}>
          {title}
        </AppText>
      </View>

      <CourseResultSummary counters={results.counters} />

      <AppCard
        className="gap-4 rounded-2xl bg-[#FFFDF8] px-4 py-4"
        style={{
          shadowColor: "#6E442A",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <AppText className="text-[17px] leading-6 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
          Progression du chapitre
        </AppText>
        <View className="flex-row items-center gap-4">
          <CourseProgressRing
            value={results.progress}
            mastered={results.counters.mastered}
            progressing={results.counters.progressing}
            needsWork={results.counters.needsWork}
            notStarted={results.counters.notStarted}
            size={82}
          />
          <View className="flex-1 gap-2.5">
            <ProgressBar
              value={results.progress}
              accessibilityLabel={`Progression du chapitre : ${results.progress} pour cent`}
            />
            <AppText tone="secondary" className="text-[14px] leading-5">
              {`${results.progress} % de progression.`}
            </AppText>
            {results.counters.notStarted > 0 ? (
              <AppText tone="secondary" className="text-[12px] leading-4">
                {results.counters.notStarted} notion{results.counters.notStarted > 1 ? "s" : ""} à découvrir.
              </AppText>
            ) : null}
          </View>
        </View>
      </AppCard>

      <RecentActivityList activities={results.recentActivities} />

      <AppButton title="Faire des exercices" iconName="pen" className="min-h-[54px]" onPress={() => router.push({ pathname: "/course/[courseId]", params: { courseId: resolvedCourseId } })} />
    </AppScreen>
  );
}
