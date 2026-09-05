import { AppText, ProgressBar } from "@/src/presentation/components/shared";
import { fonts } from "@/src/theme";
import { View } from "react-native";

type ExerciseProgressProps = {
  current: number;
  total: number;
};

export function ExerciseProgress({ current, total }: ExerciseProgressProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current }}
      className="gap-2.5"
    >
      <View className="flex-row items-center justify-between">
        <AppText variant="label" className="text-[15px] leading-5" style={{ fontFamily: fonts.bold }}>
          Exercice {current} sur {total}
        </AppText>
        <AppText tone="secondary" className="text-[14px] leading-5" style={{ fontFamily: fonts.semibold }}>
          {progress}%
        </AppText>
      </View>
      <ProgressBar value={progress} />
    </View>
  );
}
