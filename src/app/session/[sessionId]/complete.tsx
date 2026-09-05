import { AppButton, AppCard, AppScreen, AppText, ProgressBar, ScreenHeader, StatusBadge } from "@/src/presentation/components/shared";
import { loadRealReportView, type RealReportView } from "@/src/presentation/features/study-session/services/real-session-view.service";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export default function SessionCompleteScreen() {
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const [report, setReport] = useState<RealReportView | null>(null);

  useEffect(() => {
    if (sessionId) void loadRealReportView(sessionId).then(setReport);
  }, [sessionId]);

  if (!report || report.status === "missing") {
    return <AppScreen><ScreenHeader title="Rapport de séance" subtitle="Chargement" showBack /><AppCard><AppText>Rapport indisponible.</AppText></AppCard></AppScreen>;
  }

  return <AppScreen><ScreenHeader title="Rapport de séance" subtitle="Session terminée" showBack /><AppCard className="gap-4"><StatusBadge label={`${report.report.correctAnswers}/${report.report.totalAnswers} réponses correctes`} tone="success" /><AppText variant="title">{Math.round(report.report.score)}%</AppText><ProgressBar value={report.report.score} /><AppText tone="secondary">{report.report.summary}</AppText><AppButton title="Retour au cours" iconName="book" onPress={() => router.replace({ pathname: "/course/[courseId]", params: { courseId: report.session.courseId } })} /><AppButton title="Retour à l'accueil" iconName="home" variant="secondary" onPress={() => router.replace("/(tabs)")} /></AppCard></AppScreen>;
}
