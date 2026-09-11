import { GradeFilter, SubjectCard } from "@/src/presentation/components/core";
import {
  AppButton,
  AppCard,
  AppScreen,
  AppText,
  EmptyStateCard,
  ScreenHeader,
} from "@/src/presentation/components/shared";
import { useSubjectsOverview } from "@/src/presentation/features/subjects/use-subjects-overview";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

export default function CoursesScreen() {
  const { errorMessage, grades, subjects, reload, status } = useSubjectsOverview();

  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const filteredSubjects = useMemo(
    () => selectedFilter === "Tous"
      ? subjects
      : subjects.filter((subject) => subject.grades.includes(selectedFilter)),
    [selectedFilter, subjects],
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

      {grades.length > 1 ? (
        <GradeFilter
          values={grades}
          selectedValue={selectedFilter}
          onChange={setSelectedFilter}
        />
      ) : null}

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

        {status === "ready" && subjects.length === 0 ? (
          <EmptyStateCard
            title="Aucun cours pour le moment"
            description="Ajoute un cours depuis ta galerie pour le retrouver ici."
          />
        ) : null}

        {status === "ready" && subjects.length > 0 && filteredSubjects.length === 0 ? (
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
