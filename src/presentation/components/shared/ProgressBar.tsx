import { View } from "react-native";
import { colors } from "@/src/theme";

type ProgressBarProps = {
  value: number;
  accessibilityLabel?: string;
  color?: string;
  className?: string;
};

export function ProgressBar({ value, accessibilityLabel, color = colors.secondary, className }: ProgressBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: normalizedValue }}
      className={["h-2.5 overflow-hidden rounded-full bg-[#FAF1E2]", className].filter(Boolean).join(" ")}
    >
      <View className="h-full rounded-full" style={{ width: `${normalizedValue}%`, backgroundColor: color }} />
    </View>
  );
}
