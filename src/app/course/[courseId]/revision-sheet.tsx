import { AppButton, AppCard, AppScreen, AppText } from "@/src/components/shared";
import { getCourseDetail } from "@/src/features/courses";
import { CourseTopBar } from "@/src/features/courses/components";
import { loadLatestRevisionSheet, type RevisionSheetViewState } from "@/src/features/revision-sheet/services/revision-sheet-view.service";
import { startRealCourseSession } from "@/src/features/study-session/services/real-session-view.service";
import { colors, fonts } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RevisionSheetScreen() {
  const insets = useSafeAreaInsets();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const resolvedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const [realCourseExists, setRealCourseExists] = useState(false);
  const [realCourseMissing, setRealCourseMissing] = useState(false);
  const [realSheet, setRealSheet] = useState<RevisionSheetViewState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!resolvedCourseId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await getCourseDetail(resolvedCourseId);
        const loadedSheet = await loadLatestRevisionSheet(resolvedCourseId);
        if (!cancelled) {
          setRealCourseExists(true);
          setRealCourseMissing(false);
          setRealSheet(loadedSheet);
        }
      } catch {
        if (!cancelled) {
          setRealCourseExists(false);
          setRealCourseMissing(true);
          setRealSheet(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [resolvedCourseId]);

  async function startExercises() {
    if (!resolvedCourseId || !realCourseExists) {
      setSessionError("Aucun exercice réel n'est disponible pour ce cours.");
      return;
    }
    setSessionError(null);
    const session = await startRealCourseSession(resolvedCourseId);
    if (!session) {
      setSessionError("Aucun exercice réel n'est disponible pour ce cours.");
      return;
    }
    router.push({ pathname: "/session/[sessionId]", params: { sessionId: session.id } });
  }

  if (isLoading) {
    return (
      <AppScreen contentClassName="gap-4 pb-8">
        <CourseTopBar title="Ma fiche" />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Chargement de la fiche</AppText>
          <AppText tone="secondary">Préparation du contenu...</AppText>
        </AppCard>
      </AppScreen>
    );
  }

  if (realCourseExists && realSheet?.status !== "ready") {
    return (
      <AppScreen contentClassName="gap-4 pb-8">
        <CourseTopBar title="Ma fiche" />
        <AppCard className="gap-3">
          <AppText variant="subtitle">{realSheet?.status === "invalid" ? "Fiche invalide" : "Fiche absente"}</AppText>
          <AppText tone="secondary">
            {realSheet?.status === "invalid"
              ? "La fiche enregistrée ne peut pas être affichée."
              : "Génère une fiche depuis le détail du cours."}
          </AppText>
          <AppButton title="Retour au cours" iconName="arrow-left" onPress={() => router.back()} />
        </AppCard>
      </AppScreen>
    );
  }

  if (realCourseMissing) {
    return (
      <AppScreen contentClassName="gap-4 pb-8">
        <CourseTopBar title="Ma fiche" />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Cours introuvable</AppText>
          <AppText tone="secondary">Aucun cours SQLite ne correspond à cet identifiant.</AppText>
          <AppButton title="Retour aux cours" iconName="arrow-left" onPress={() => router.replace("/courses")} />
        </AppCard>
      </AppScreen>
    );
  }

  if (realSheet?.status === "ready") {
    const content = realSheet.content;
    const sections = [
      ["Notions clés", content.keyConcepts],
      ["Définitions", content.definitions],
      ["Formules", content.formulas],
      ["Exemples", content.examples],
      ["Erreurs fréquentes", content.commonMistakes],
      ["À retenir", content.importantPoints],
    ] as const;

    return (
      <AppScreen
        contentClassName="gap-4 pt-2"
        contentStyle={{ paddingBottom: Math.max(insets.bottom + 28, 58) }}
      >
        <CourseTopBar title="Ma fiche" />
        <View className="gap-2">
          <AppText
            variant="heading"
            className="text-[25px] leading-[31px] text-[#2F241F]"
            style={{ fontFamily: fonts.bold }}
          >
            {content.title}
          </AppText>
          <AppText tone="secondary" className="text-[15px] leading-[22px]">
            {content.summary}
          </AppText>
        </View>
        {sections.map(([title, items]) => (
          <RevisionListSection key={title} title={title} items={items} />
        ))}
        {sessionError ? <AppText tone="error">{sessionError}</AppText> : null}
        <AppButton title="Faire des exercices" iconName="pen" className="min-h-[54px]" onPress={() => void startExercises()} />
      </AppScreen>
    );
  }

}

function RevisionListSection({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <AppCard
      className="gap-3 rounded-2xl bg-[#FFFDF8] px-4 py-4"
      style={{
        shadowColor: "#6E442A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <AppText className="text-[17px] leading-6 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
        {title}
      </AppText>
      {items.length > 0 ? (
        <View className="gap-2.5">
          {items.map((item) => (
            <View key={item} className="flex-row items-start gap-2.5">
              <View className="mt-[8px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.secondary }} />
              <AppText tone="secondary" className="flex-1 text-[14px] leading-[21px]">
                {item}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText tone="muted" className="text-[14px] leading-[21px]">
          Aucun élément.
        </AppText>
      )}
    </AppCard>
  );
}
