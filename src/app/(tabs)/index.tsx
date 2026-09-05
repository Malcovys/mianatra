import { SubjectCard } from "@/src/presentation/components/core";
import {
  AppButton,
  AppCard,
  AppScreen,
  AppText,
} from "@/src/presentation/components/shared";
import type { HomeDashboardActiveSession, HomeDashboardSubject } from "@/src/presentation/features/home/home-dashboard.types";
import { useHomeDashboard } from "@/src/presentation/features/home/use-home-dashboard";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import { ImageBackground, Pressable, View } from "react-native";


/** Local helpers */
function openSubject(subjectId: string) {
  router.push({
    pathname: "/subject/[subjectId]",
    params: { subjectId },
  });
}

function openSession(sessionId: string) {
  router.push({
    pathname: "/session/[sessionId]",
    params: { sessionId },
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

  const activeSession = dashboard.activeSession;
  const reminderSubject = dashboard.recentSubjects[0] ?? null;

  return (
    <AppScreen contentClassName="gap-4 pb-10 pt-3">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1 gap-1">
          <AppText
            variant="subtitle"
            numberOfLines={1}
            className="text-[17px] leading-6"
          >
            Bonjour 👋
          </AppText>
          <AppText tone="secondary" numberOfLines={1} className="text-[14px] leading-5">
            Prête pour une petite révision ?
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
        >
          <FontAwesome5 name="bell" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <RevisionReminder activeSession={activeSession} subject={reminderSubject} />

      <View className="flex-row items-center justify-between gap-3">
        <AppText
          variant="heading"
          className="text-[20px] leading-6"
          style={{ fontFamily: fonts.bold }}
        >
          Mes cours
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir tous mes cours"
          onPress={() => router.push("/courses")}
          className="min-h-9 justify-center rounded-full px-1 active:opacity-80"
        >
          <AppText
            variant="label"
            tone="secondary"
            className="text-[13px] leading-5"
            style={{ fontFamily: fonts.semibold }}
          >
            Voir tout
          </AppText>
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
          <AppCard
            className="gap-2 rounded-xl p-4"
            style={{
              shadowColor: "#6E442A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <AppText variant="label" className="text-[16px] leading-5">
              Aucun cours pour le moment
            </AppText>
            <AppText tone="secondary" className="text-[14px] leading-5">
              Ajoute un cours depuis ta galerie pour le retrouver ici.
            </AppText>
          </AppCard>
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


/** Local Component */
function RevisionReminder({ activeSession, subject }: {
  activeSession: HomeDashboardActiveSession | null;
  subject: HomeDashboardSubject | null;
}) {
  if (!activeSession && !subject) {
    return null;
  }

  const eyebrow = activeSession ? "Reprendre maintenant" : "À faire maintenant";
  const title = activeSession ? "Reprendre ma séance" : (subject?.name ?? "Révision");
  const subtitle = activeSession?.courseTitle ?? `${subject?.chapterCount ?? 0} chapitre${subject?.chapterCount && subject.chapterCount > 1 ? "s" : ""}`;
  const weakness = subject?.mainWeakness
    ? `À renforcer : ${subject.mainWeakness}`
    : activeSession
      ? "Continue là où tu t'es arrêté."
      : "Une petite révision maintenant peut faire la différence.";
  const durationLabel = activeSession?.totalExercises
    ? `${activeSession.totalExercises} exercices`
    : "Environ 10 minutes";

  function handlePress() {
    if (activeSession) {
      openSession(activeSession.id);
      return;
    }
    if (subject) {
      openSubject(subject.id);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={activeSession ? "Continuer ma révision" : `Réviser ${title}`}
      onPress={handlePress}
      className="active:opacity-90"
    >
      <View
        className="overflow-hidden rounded-[28px] bg-[#F2B84B] px-4 pb-3 pt-4"
        style={{
          shadowColor: "#C75A19",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 18,
          elevation: 6,
        }}
      >
        <View className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#FFE29A] opacity-80" />
        <View className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-[#D94B24] opacity-20" />
        <ImageBackground
          source={require("../../../assets/mianatra/decoration_lamba_corner.png")}
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          className="absolute -bottom-2 -left-2 h-16 w-28 opacity-70"
        />

        <View className="gap-2">
          <View className="min-w-0 gap-2">
            <View className="self-start rounded-full bg-[#FFE7A7] px-3 py-1">
              <AppText variant="caption" className="text-[11px] uppercase leading-4 text-[#7A3A1C]">
                {eyebrow}
              </AppText>
            </View>
            <AppText variant="heading" numberOfLines={1} className="text-[21px] leading-6 text-[#2F241F]">
              {title}
            </AppText>
            <AppText variant="label" numberOfLines={1} className="text-[16px] leading-5 text-[#3A2A22]">
              {subtitle}
            </AppText>
            <AppText tone="secondary" numberOfLines={2} className="max-w-[230px] text-[13px] leading-[18px] text-[#5B4A3F]">
              {weakness}
            </AppText>
            <View className="mt-1 flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-1.5 rounded-full bg-[#FFEBC0] px-2.5 py-1">
                <FontAwesome5 name="clock" size={12} color="#5B4A3F" />
                <AppText className="text-[12px] leading-4 text-[#5B4A3F]">
                  {durationLabel}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View
          className="mt-4 min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#D94B24]"
          style={{
            shadowColor: "#9E321F",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <AppText variant="label" tone="inverse" className="text-[15px] leading-5">
            {activeSession ? "Continuer ma révision" : "Réviser maintenant"}
          </AppText>
          <FontAwesome5 name="arrow-right" size={14} color={colors.white} />
        </View>
      </View>
    </Pressable>
  );
}