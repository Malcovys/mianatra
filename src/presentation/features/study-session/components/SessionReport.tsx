import { AppCard, AppText, ProgressBar, StatusBadge } from "@/src/presentation/components/shared";
import { View } from "react-native";
import type { SessionSummary } from "../types/study-session.types";

type SessionReportProps = {
  summary: SessionSummary;
};

export function SessionReport({ summary }: SessionReportProps) {
  return (
    <AppCard accessibilityLabel="Rapport de séance" className="gap-4">
      <View className="gap-2">
        <StatusBadge
          label={`${summary.correctAnswers}/${summary.totalExercises} réponses correctes`}
          tone={summary.score >= 70 ? "success" : "progress"}
        />
        <AppText variant="title">{summary.score}%</AppText>
        <ProgressBar value={summary.score} />
      </View>
      <View className="gap-2">
        <AppText variant="subtitle">Point fort</AppText>
        <AppText tone="secondary">{summary.strength}</AppText>
      </View>
      <View className="gap-2">
        <AppText variant="subtitle">À renforcer</AppText>
        <AppText tone="secondary">{summary.notionToImprove}</AppText>
      </View>
      <View className="gap-2">
        <AppText variant="subtitle">Prochaine étape</AppText>
        <AppText tone="secondary">{summary.nextRecommendation}</AppText>
      </View>
      <View className="gap-2 rounded-xl border border-[#F2B84B] bg-[#FFF3D2] p-4">
        <AppText variant="label">Exercices ciblés disponibles</AppText>
        <AppText tone="secondary">
          {summary.targetedExercises.length} exercices statiques liés à la notion à renforcer.
        </AppText>
      </View>
    </AppCard>
  );
}
