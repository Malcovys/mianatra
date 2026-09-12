import { SubjectCard } from "@/src/presentation/components/core";
import {
  AppButton,
  AppCard,
  AppScreen,
  AppText,
  EmptyStateCard,
} from "@/src/presentation/components/shared";
import { useHomeDashboard } from "@/src/presentation/features/home/use-home-dashboard";
import { colors } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import { Pressable, View } from "react-native";


/** Local helpers */
function openSubject(subjectId: string) {
  router.push({
    pathname: "/subject/[subjectId]",
    params: { subjectId },
  });
}


/** Screen */
export default function HomeScreen() {
  const { dashboard, errorMessage, reload, status } = useHomeDashboard();

  if (status === "loading") {
    return (
      <AppScreen contentClassName="gap-5 pb-10">
        <AppCard className="gap-3">
          <AppText variant="subtitle">Chargement de ton accueil…</AppText>
          <AppText tone="secondary">On récupère tes cours enregistrés.</AppText>
        </AppCard>
      </AppScreen>
    );
  }

  if (status === "error" || !dashboard) {
    return (
      <AppScreen contentClassName="gap-5 pb-10">
        <AppCard className="gap-3">
          <AppText variant="subtitle">{"Impossible de charger l'accueil"}</AppText>
          <AppText tone="secondary">{errorMessage ?? "Une erreur est survenue."}</AppText>
          <AppButton title="Réessayer" iconName="redo" onPress={reload} />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentClassName="gap-4 pb-10 pt-3">
      <View className="items-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Parameters"
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
        >
          <FontAwesome5 name="cog" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View className="gap-3">
        {dashboard.recentSubjects.length > 0 ? (
          dashboard.recentSubjects.map((subject) => (
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
        ) : (
          <EmptyStateCard
            title="Aucun cours pour le moment"
            description="Ajoute un cours depuis ta galerie pour le retrouver ici."
          />
        )}
      </View>

      <AppButton
        title="Ajouter un cours"
        iconName="plus"
        onPress={() => router.push("/course/add")}
        className="min-h-[54px]"
      />
    </AppScreen>
  );
}