import { AppCard, AppText, StatusBadge } from "@/src/presentation/components/shared";
import { colors, fonts } from "@/src/theme";
import { View } from "react-native";
import type { SessionAttempt } from "../types/study-session.types";

type CorrectionPanelProps = {
  exercise: {
    expectedAnswer: string;
    explanation: string;
    correctionSteps: string[];
  };
  attempt: SessionAttempt;
};

export function CorrectionPanel({ exercise, attempt }: CorrectionPanelProps) {
  return (
    <AppCard
      accessibilityLabel={attempt.isCorrect ? "Correction correcte" : "Correction à reprendre"}
      className="gap-4 rounded-2xl bg-[#FFFDF8] px-4 py-4"
      style={{
        shadowColor: "#6E442A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <StatusBadge
        label={attempt.isCorrect ? "Réponse correcte" : "Réponse à reprendre"}
        tone={attempt.isCorrect ? "success" : "warning"}
      />
      <View className="flex-row gap-3">
        <View className="min-h-[86px] flex-1 justify-between gap-2 rounded-2xl border border-[#E8D9C7] bg-[#FFFDF8] p-3">
          <AppText tone="secondary" className="text-[12px] leading-4" style={{ fontFamily: fonts.medium }}>
            Ta réponse
          </AppText>
          <AppText numberOfLines={2} className="text-[15px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
            {attempt.answer}
          </AppText>
        </View>
        <View className="min-h-[86px] flex-1 justify-between gap-2 rounded-2xl border border-[#2E7D70] bg-[#EEF8F4] p-3">
          <AppText tone="secondary" className="text-[12px] leading-4" style={{ fontFamily: fonts.medium }}>
            Réponse attendue
          </AppText>
          <AppText numberOfLines={2} className="text-[15px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
            {exercise.expectedAnswer}
          </AppText>
        </View>
      </View>
      <View className="gap-2.5">
        <AppText className="text-[16px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
          Explication
        </AppText>
        <AppText tone="secondary" className="text-[14px] leading-[21px]">
          {exercise.explanation}
        </AppText>
      </View>
      <View className="gap-2.5">
        <AppText className="text-[16px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
          Méthode
        </AppText>
        {exercise.correctionSteps.map((step, index) => (
          <View key={step} className="flex-row items-start gap-3">
            <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: colors.secondary }}>
              <AppText tone="inverse" className="text-[12px] leading-4" style={{ fontFamily: fonts.bold }}>
                {index + 1}
              </AppText>
            </View>
            <AppText className="flex-1 text-[14px] leading-[21px]" tone="secondary">
              {step}
            </AppText>
          </View>
        ))}
      </View>
      {attempt.usedHint ? (
        <AppText variant="caption" tone="secondary">
          {"Indice consulté pendant l'exercice."}
        </AppText>
      ) : null}
    </AppCard>
  );
}
