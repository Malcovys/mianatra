import {
    AppButton,
    AppCard,
    AppScreen,
    AppText,
    ProgressBar,
} from "@/src/presentation/components/shared";
import { useCourseProcessing } from "@/src/presentation/features/course-processing";
import { buildRealCourseResults, emptyCourseResultCounters } from "@/src/presentation/features/courses";
import {
    CourseActionTabs,
    CourseProgressCard,
    CourseSummary,
    CourseTopBar,
} from "@/src/presentation/features/courses/components";
import { countRealCourseExercises, startRealCourseSession } from "@/src/presentation/features/study-session/services/real-session-view.service";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CoursePrimaryAction = {
  title: string;
  iconName: React.ComponentProps<typeof FontAwesome5>["name"];
  onPress: () => void | Promise<void>;
};

export default function CourseDetailScreen() {
  const insets = useSafeAreaInsets();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const resolvedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const processing = useCourseProcessing(resolvedCourseId);
  const [realExerciseCount, setRealExerciseCount] = useState(0);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const realDetail = processing.detail;
  const realResults = realDetail ? buildRealCourseResults(realDetail) : null;
  const course = realDetail
    ? {
        id: realDetail.course.id,
        title: realDetail.course.title,
        subject: realDetail.subject?.name ?? "Cours",
        pageCount: realDetail.pages.length,
        progress: realResults?.progress ?? 0,
        lastRevision: realDetail.course.lastReviewedAt ? "récente" : "jamais",
        summary: realDetail.course.summary ? [realDetail.course.summary] : [],
      }
    : null;

  useEffect(() => {
    let cancelled = false;
    if (!realDetail) {
      setRealExerciseCount(0);
      return;
    }
    countRealCourseExercises(realDetail.course.id).then((count) => {
      if (!cancelled) {
        setRealExerciseCount(count);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [realDetail, processing.result.exercises.length]);

  const action = useMemo<CoursePrimaryAction>(() => {
    const isBusy = ["analyzing", "persisting", "generating_sheet", "generating_exercises"].includes(processing.status);
    if (!realDetail) {
      return {
        title: "Réviser le cours",
        iconName: "file-alt" as const,
        onPress: () =>
          router.push({
            pathname: "/course/[courseId]/revision-sheet",
            params: { courseId: "" },
          }),
      };
    }
    const hasAnalysis = Boolean(realDetail.latestAnalysis || processing.result.persistedAnalysis || processing.pendingAnalysis || processing.result.analysis);
    const hasRevisionSheet = Boolean(realDetail.latestRevisionSheet || processing.result.revisionSheet);
    if (!hasAnalysis) {
      return {
        title: "Analyser le cours",
        iconName: "magic" as const,
        onPress: () => void processing.startProcessing?.()?.catch(() => undefined),
      };
    }
    if (!hasRevisionSheet) {
      return {
        title: "Générer ma fiche",
        iconName: "file-alt" as const,
        onPress: () => void processing.generateAssetsFromPersisted?.()?.catch(() => undefined),
      };
    }
    if (realExerciseCount === 0 && processing.result.exercises.length === 0) {
      return {
        title: isBusy ? "Génération des exercices" : "Réessayer les exercices",
        iconName: "pen" as const,
        onPress: () => {
          const run = processing.status === "error" ? processing.retry?.() : processing.generateAssetsFromPersisted?.();
          void run?.catch(() => undefined);
        },
      };
    }
    return {
      title: "Commencer à réviser",
      iconName: "play" as const,
      onPress: async () => {
        setSessionError(null);
        const session = await startRealCourseSession(realDetail.course.id);
        if (!session) {
          setSessionError("Aucun exercice réel n'est disponible pour ce cours.");
          return;
        }
        router.push({ pathname: "/session/[sessionId]", params: { sessionId: session.id } });
      },
    };
  }, [processing, realDetail, realExerciseCount]);

  async function openExercises() {
    setSessionError(null);
    if (!realDetail) {
      return;
    }

    const session = await startRealCourseSession(realDetail.course.id);
    if (!session) {
      setSessionError("Aucun exercice réel n'est disponible pour ce cours.");
      return;
    }
    router.push({ pathname: "/session/[sessionId]", params: { sessionId: session.id } });
  }

  if (!realDetail && !processing.hasLoadedDetail) {
    return (
      <AppScreen contentClassName="gap-5 pb-8">
        <CourseTopBar title="Chargement" />
        <AppCard className="gap-4">
          <AppText variant="subtitle">Chargement du cours</AppText>
          <AppText tone="secondary">Lecture des données SQLite...</AppText>
        </AppCard>
      </AppScreen>
    );
  }

  if (!course) {
    return (
      <AppScreen contentClassName="gap-5 pb-8">
        <CourseTopBar title="Cours introuvable" />
        <AppCard className="gap-4">
          <AppText variant="subtitle">Cours introuvable</AppText>
          <AppText tone="secondary">
            {"Ce cours n'existe pas ou n'est pas disponible."}
          </AppText>
          <AppButton
            title="Retour à Mes cours"
            iconName="arrow-left"
            onPress={() => router.replace("/courses")}
          />
        </AppCard>
      </AppScreen>
    );
  }

  const summaryItems = course.summary ?? [];
  const progressCounters = realResults?.counters ?? emptyCourseResultCounters;
  const showProcessingCard =
    realDetail &&
    (["analyzing", "persisting", "generating_sheet", "generating_exercises", "error"].includes(processing.status) ||
      Boolean(processing.pendingAnalysis));

  function showOptions() {
    Alert.alert(
      "Options du cours",
      "Renommer — disponible prochainement\nArchiver — disponible prochainement\nSupprimer — disponible prochainement",
    );
  }

  return (
    <AppScreen
      contentClassName="gap-4 pt-2"
      contentStyle={{ paddingBottom: Math.max(insets.bottom + 28, 58) }}
    >
      <CourseTopBar title={course.subject} onOptionsPress={showOptions} />

      <View className="relative min-h-[128px] justify-end pb-2 pr-[136px]" style={{ zIndex: 2 }}>
        <View className="gap-1.5">
          <AppText
            variant="heading"
            numberOfLines={2}
            className="text-[23px] leading-[28px] text-[#2F241F]"
            style={{ fontFamily: fonts.bold }}
          >
            {course.title}
          </AppText>
          <AppText tone="secondary" className="text-[12px] leading-4">
            {course.pageCount} page{course.pageCount > 1 ? "s" : ""} de cours
          </AppText>
          <AppText tone="secondary" className="text-[12px] leading-4">
            Dernière révision : {course.lastRevision}
          </AppText>
        </View>
        <Image
          source={require("../../../../assets/mianatra/illustration_student_reading.png")}
          accessibilityLabel="Élève lisant son cours"
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          className="absolute -bottom-7 right-0 h-[132px] w-[136px]"
          style={{ zIndex: 3 }}
        />
      </View>

      <CourseProgressCard
        progress={course.progress}
        mastered={progressCounters.mastered}
        progressing={progressCounters.progressing}
        needsWork={progressCounters.needsWork}
        notStarted={progressCounters.notStarted}
      />

      <AppCard className="overflow-hidden rounded-2xl p-0">
        <CourseActionTabs
          tabs={[
            {
              id: "revision",
              label: "Ma fiche",
              iconName: "file-alt",
              onPress: () =>
                router.push({
                  pathname: "/course/[courseId]/revision-sheet",
                  params: { courseId: course.id },
                }),
            },
            {
              id: "exercises",
              label: "Mes exercices",
              iconName: "chart-line",
              disabled: Boolean(realDetail && realExerciseCount === 0 && processing.result.exercises.length === 0),
              onPress: () => void openExercises(),
            },
            {
              id: "results",
              label: "Mes résultats",
              iconName: "link",
              onPress: () =>
                router.push({
                  pathname: "/course/[courseId]/results",
                  params: { courseId: course.id },
                }),
            },
          ]}
        />
        <CourseSummary items={summaryItems} />
      </AppCard>

      {showProcessingCard ? (
        <AppCard className="gap-4">
          <View className="gap-2">
            <AppText variant="subtitle">Traitement du cours</AppText>
            <AppText tone="secondary">{processing.progress.message}</AppText>
          </View>
          <ProgressBar value={processing.progress.percent} accessibilityLabel="Progression du traitement" />
          {processing.progress.totalPages > 0 ? (
            <AppText tone="secondary">
              {processing.progress.currentPage} / {processing.progress.totalPages} pages
            </AppText>
          ) : null}
          {processing.result.analysis ? (
            <View className="gap-2">
              <AppText variant="label">Analyse détectée</AppText>
              <AppText tone="secondary">
                {processing.result.analysis.detectedTitle} • {processing.result.analysis.detectedSubject} •{" "}
                {processing.result.analysis.concepts.length} concept(s)
              </AppText>
              <AppText tone="secondary">{processing.result.analysis.summary}</AppText>
              {processing.result.warnings.map((warning) => (
                <AppText key={warning} tone="secondary">{warning}</AppText>
              ))}
              {processing.pendingAnalysis ? (
                <AppButton
                  title="Confirmer et continuer"
                  iconName="check"
                  loading={["persisting", "generating_sheet", "generating_exercises"].includes(processing.status)}
                  onPress={() => void processing.confirmAndContinue?.()?.catch(() => undefined)}
                />
              ) : null}
            </View>
          ) : null}
          {processing.error ? (
            <View className="gap-3">
              <AppText accessibilityRole="alert" tone="error">{processing.error}</AppText>
              <AppButton title="Réessayer" iconName="redo" variant="secondary" onPress={() => void processing.retry?.()?.catch(() => undefined)} />
            </View>
          ) : null}
          {sessionError ? <AppText tone="error">{sessionError}</AppText> : null}
        </AppCard>
      ) : null}

      <AppButton
        title={action.title}
        iconName={action.iconName}
        loading={["analyzing", "persisting", "generating_sheet", "generating_exercises"].includes(processing.status)}
        onPress={action.onPress}
        className="min-h-[54px]"
      />
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Faire des exercices"
          accessibilityState={{ disabled: Boolean(realDetail && realExerciseCount === 0 && processing.result.exercises.length === 0) }}
          disabled={Boolean(realDetail && realExerciseCount === 0 && processing.result.exercises.length === 0)}
          onPress={() => void openExercises()}
          className={[
            "min-h-[48px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#E8D9C7] bg-[#FFFDF8] px-2 active:opacity-80",
            realDetail && realExerciseCount === 0 && processing.result.exercises.length === 0 ? "opacity-45" : "",
          ].join(" ")}
        >
          <FontAwesome5 name="pen" size={13} color={colors.textPrimary} />
          <AppText variant="label" numberOfLines={1} className="text-[12px] leading-4" style={{ fontFamily: fonts.semibold }}>
            Exercices
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir mes résultats"
          onPress={() =>
            router.push({
              pathname: "/course/[courseId]/results",
              params: { courseId: course.id },
            })
          }
          className="min-h-[48px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#E8D9C7] bg-[#FFFDF8] px-2 active:opacity-80"
        >
          <FontAwesome5 name="chart-line" size={13} color={colors.textPrimary} />
          <AppText variant="label" numberOfLines={1} className="text-[12px] leading-4" style={{ fontFamily: fonts.semibold }}>
            Résultats
          </AppText>
        </Pressable>
      </View>
    </AppScreen>
  );
}
