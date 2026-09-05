import { CourseCard } from "@/src/presentation/components/core";
import { AppButton, AppCard, AppScreen, AppText, ProgressBar, ScreenHeader } from "@/src/presentation/components/shared";
import { loadSubjectDetail, type SubjectDetailView } from "@/src/presentation/features/subjects";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";

type SubjectDetailStatus = "loading" | "ready" | "missing" | "error";

function lastReviewedLabel(value: string | null) {
  return value ? "récente" : "jamais";
}

export default function SubjectDetailScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  const resolvedSubjectId = Array.isArray(subjectId) ? subjectId[0] : subjectId;
  const loadIdRef = useRef(0);
  const [detail, setDetail] = useState<SubjectDetailView | null>(null);
  const [status, setStatus] = useState<SubjectDetailStatus>("loading");

  const reload = useCallback(() => {
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    setStatus("loading");

    if (!resolvedSubjectId) {
      setDetail(null);
      setStatus("missing");
      return;
    }

    void loadSubjectDetail(resolvedSubjectId)
      .then((nextDetail) => {
        if (loadIdRef.current !== loadId) {
          return;
        }
        setDetail(nextDetail);
        setStatus(nextDetail ? "ready" : "missing");
      })
      .catch(() => {
        if (loadIdRef.current !== loadId) {
          return;
        }
        setDetail(null);
        setStatus("error");
      });
  }, [resolvedSubjectId]);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        loadIdRef.current += 1;
      };
    }, [reload]),
  );

  if (status === "loading") {
    return (
      <AppScreen contentClassName="gap-5 pb-10">
        <ScreenHeader title="Matière" subtitle="Chargement des chapitres." />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Chargement de la matière…</AppText>
          <AppText tone="secondary">Lecture des chapitres enregistrés sur ce téléphone.</AppText>
        </AppCard>
      </AppScreen>
    );
  }

  if (status === "missing") {
    return (
      <AppScreen contentClassName="gap-5 pb-10">
        <ScreenHeader title="Matière introuvable" subtitle="Cette matière n’est pas disponible." />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Matière introuvable</AppText>
          <AppText tone="secondary">Elle a peut-être été supprimée ou n’existe pas sur ce téléphone.</AppText>
          <AppButton title="Retour à Mes cours" iconName="arrow-left" onPress={() => router.replace("/courses")} />
        </AppCard>
      </AppScreen>
    );
  }

  if (status === "error" || !detail) {
    return (
      <AppScreen contentClassName="gap-5 pb-10">
        <ScreenHeader title="Matière" subtitle="Erreur de lecture." />
        <AppCard className="gap-3">
          <AppText variant="subtitle">Impossible de charger la matière</AppText>
          <AppText tone="secondary">Une erreur est survenue pendant la lecture des données SQLite.</AppText>
          <AppButton title="Réessayer" iconName="redo" variant="secondary" onPress={reload} />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentClassName="gap-5 pb-10">
      <ScreenHeader title={detail.subject.name} subtitle={`${detail.subject.chapterCount} chapitre${detail.subject.chapterCount > 1 ? "s" : ""}`} />

      <AppCard className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="subtitle">Progression de la matière</AppText>
          <AppText variant="label">{detail.subject.progress}%</AppText>
        </View>
        <ProgressBar value={detail.subject.progress} accessibilityLabel={`Progression ${detail.subject.name}`} />
        <AppText tone="secondary">
          {detail.subject.mainWeakness ? `À renforcer : ${detail.subject.mainWeakness}` : "Pas encore révisé"}
        </AppText>
      </AppCard>

      <View className="gap-3">
        <AppText variant="heading">Chapitres</AppText>
        {detail.chapters.length === 0 ? (
          <AppCard className="gap-3">
            <AppText variant="subtitle">Aucun chapitre</AppText>
            <AppText tone="secondary">Ajoute un cours dans cette matière pour le retrouver ici.</AppText>
          </AppCard>
        ) : (
          detail.chapters.map((chapter) => (
            <CourseCard
              key={chapter.id}
              course={{
                id: chapter.id,
                title: chapter.title,
                subject: detail.subject.name,
                grade: chapter.grade,
                pageCount: chapter.pageCount,
                progress: chapter.progress,
                iconName: chapter.iconName,
                color: chapter.subjectColor,
                focusText: `Dernière révision : ${lastReviewedLabel(chapter.lastReviewedAt)}`,
              }}
              onPress={() =>
                router.push({
                  pathname: "/course/[courseId]",
                  params: { courseId: chapter.id },
                })
              }
            />
          ))
        )}
      </View>

      <AppButton
        title="Ajouter un cours"
        iconName="plus"
        onPress={() =>
          router.push({
            pathname: "/course/add",
            params: { subjectId: detail.subject.id },
          })
        }
      />
    </AppScreen>
  );
}
