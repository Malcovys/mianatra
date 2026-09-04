import { AppButton, AppCard, AppScreen, AppText, ScreenHeader } from "@/src/components/shared";
import { CorrectionPanel } from "@/src/features/study-session/components";
import { completeRealSessionAndBuildReport, loadRealCorrectionView, type RealCorrectionView } from "@/src/features/study-session/services/real-session-view.service";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export default function SessionCorrectionScreen() {
  const params = useLocalSearchParams<{ sessionId: string; attemptId?: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const attemptId = Array.isArray(params.attemptId) ? params.attemptId[0] : params.attemptId;
  const [view, setView] = useState<RealCorrectionView | null>(null);

  useEffect(() => {
    if (sessionId && attemptId) void loadRealCorrectionView(sessionId, attemptId).then(setView);
  }, [attemptId, sessionId]);

  if (!view || view.status === "missing") return <AppScreen><ScreenHeader title="Correction" subtitle="Chargement" showBack /><AppCard><AppText>Correction indisponible.</AppText></AppCard></AppScreen>;
  const attempt = { exerciseId: view.attempt.exerciseId, answer: view.attempt.userAnswer, normalizedAnswer: view.attempt.userAnswer, isCorrect: view.attempt.isCorrect, expectedAnswer: view.exercise.expectedAnswer, conceptName: view.exercise.conceptName, usedHint: view.attempt.usedHint };
  return <AppScreen><ScreenHeader title="Correction" subtitle={view.exercise.title} showBack /><CorrectionPanel attempt={attempt} exercise={view.exercise} /><AppButton title={view.isLastExercise ? "Voir mon rapport" : "Retour à la session"} iconName={view.isLastExercise ? "chart-bar" : "arrow-right"} onPress={() => view.isLastExercise ? void completeRealSessionAndBuildReport(sessionId).then(() => router.replace({ pathname: "/session/[sessionId]/complete", params: { sessionId } })) : router.replace({ pathname: "/session/[sessionId]", params: { sessionId } })} /></AppScreen>;
}
