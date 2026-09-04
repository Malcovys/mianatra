import { GradeFilter, SubjectCard, type GradeFilterValue } from "@/src/components/core";
import { AppButton, AppCard, AppScreen, AppText, ScreenHeader } from "@/src/components/shared";
import { useSubjectsOverview } from "@/src/features/subjects/use-subjects-overview";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

export default function CoursesScreen() {
  const { errorMessage, grades, items, reload, status } = useSubjectsOverview();
  const [selectedFilter, setSelectedFilter] = useState<GradeFilterValue>("Tous");
  const filterValues: GradeFilterValue[] = grades;
  const effectiveSelectedFilter = filterValues.includes(selectedFilter) ? selectedFilter : "Tous";
  const filteredSubjects = useMemo(
    () =>
      effectiveSelectedFilter === "Tous"
        ? items
        : items.filter((subject) => subject.grades.includes(effectiveSelectedFilter)),
    [effectiveSelectedFilter, items],
  );

  function openSubject(subjectId: string) {
    router.push({
      pathname: "/subject/[subjectId]",
      params: { subjectId },
    });
  }

  return (
    <AppScreen contentClassName="gap-5 pb-10">
      <ScreenHeader title="Mes cours" subtitle="Tous tes cours au même endroit." />

      <GradeFilter
        values={filterValues}
        selectedValue={effectiveSelectedFilter}
        onChange={setSelectedFilter}
      />

      <View className="gap-3">
        {status === "loading" ? (
          <AppCard className="gap-3">
            <AppText variant="subtitle">Chargement de tes cours…</AppText>
            <AppText tone="secondary">On récupère les cours enregistrés sur ce téléphone.</AppText>
          </AppCard>
        ) : null}

        {status === "error" ? (
          <AppCard className="gap-3">
            <AppText variant="subtitle">Impossible de charger tes cours</AppText>
            <AppText tone="secondary">{errorMessage ?? "Une erreur est survenue."}</AppText>
            <AppButton title="Réessayer" iconName="redo" variant="secondary" onPress={reload} />
          </AppCard>
        ) : null}

        {status === "ready" && items.length === 0 ? (
          <AppCard className="gap-3">
            <AppText variant="subtitle">Aucun cours pour le moment</AppText>
            <AppText tone="secondary">Ajoute un cours depuis ta galerie pour le retrouver ici.</AppText>
          </AppCard>
        ) : null}

        {status === "ready" && items.length > 0 && filteredSubjects.length === 0 ? (
          <AppCard className="gap-3">
            <AppText variant="subtitle">Aucun cours pour ce filtre.</AppText>
            <AppText tone="secondary">Choisis une autre classe ou ajoute un nouveau cours.</AppText>
          </AppCard>
        ) : null}

        {status === "ready" && filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={{
                id: subject.id,
                name: subject.name,
                chapterCount: subject.chapterCount,
                progress: subject.progress,
                iconName: subject.iconName,
                color: subject.color,
                mainWeakness: subject.mainWeakness,
              }}
              onPress={() => openSubject(subject.id)}
            />
          ))
        ) : null}
      </View>

      <AppButton
        title="Ajouter un cours"
        iconName="plus"
        onPress={() => router.push("/course/add")}
      />
    </AppScreen>
  );
}
