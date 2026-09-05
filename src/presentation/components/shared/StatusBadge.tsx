import { View } from "react-native";
import { colors } from "@/src/theme";
import { AppText } from "./AppText";

type StatusBadgeTone = "success" | "progress" | "warning";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

const badgeColor: Record<StatusBadgeTone, string> = {
  success: colors.secondary,
  progress: colors.accent,
  warning: colors.primary,
};

export function StatusBadge({ label, tone = "progress" }: StatusBadgeProps) {
  return (
    <View className="min-h-8 self-start justify-center rounded-full border bg-[#FFFDF8] px-3" style={{ borderColor: badgeColor[tone] }}>
      <AppText variant="caption" tone="primary">
        {label}
      </AppText>
    </View>
  );
}
